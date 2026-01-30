from typing import Optional
from models.icp import ICPConfig


class ICPScorer:
    """Service for scoring prospects against an ICP configuration"""

    def __init__(self, icp_config: Optional[ICPConfig] = None):
        self.icp = icp_config

    def score_prospect(
        self,
        prospect_data: dict,
        company_data: dict,
        research_data: dict
    ) -> dict:
        """
        Score a prospect against the ICP.

        Returns:
            dict with total_score (0-100), breakdown, match_reasons, concerns, recommendation
        """
        if not self.icp:
            return {
                "total_score": 50,
                "breakdown": {},
                "match_reasons": [],
                "concerns": ["No ICP configured"],
                "recommendation": "medium_priority"
            }

        breakdown = {
            "title_match": self._score_title(prospect_data),
            "company_fit": self._score_company(company_data),
            "signals": self._score_signals(research_data),
            "trigger_events": self._score_triggers(research_data)
        }

        # Apply weights
        total_score = (
            breakdown["title_match"] * (self.icp.weight_title_match / 100) +
            breakdown["company_fit"] * (self.icp.weight_company_fit / 100) +
            breakdown["signals"] * (self.icp.weight_signals / 100) +
            breakdown["trigger_events"] * (self.icp.weight_trigger_events / 100)
        )

        # Collect reasons
        match_reasons = []
        concerns = []

        if breakdown["title_match"] >= 70:
            match_reasons.append(f"Strong title match: {prospect_data.get('title', '')}")
        elif breakdown["title_match"] < 30:
            concerns.append("Title doesn't match ICP targets")

        if breakdown["company_fit"] >= 70:
            match_reasons.append("Company fits ICP criteria")
        elif breakdown["company_fit"] < 30:
            concerns.append("Company may not be ideal fit")

        if breakdown["signals"] >= 70:
            match_reasons.append("Strong positive signals detected")
        elif breakdown["signals"] < 30 and research_data:
            concerns.append("Few positive signals found")

        # Determine recommendation
        if total_score >= 80:
            recommendation = "high_priority"
        elif total_score >= 60:
            recommendation = "medium_priority"
        elif total_score >= 40:
            recommendation = "low_priority"
        else:
            recommendation = "skip"

        return {
            "total_score": round(total_score),
            "breakdown": breakdown,
            "match_reasons": match_reasons,
            "concerns": concerns,
            "recommendation": recommendation
        }

    def _score_title(self, prospect_data: dict) -> int:
        """Score prospect's title match (0-100)"""
        title = (prospect_data.get("title") or "").lower()
        if not title:
            return 30  # Default score for unknown

        score = 0

        # Check exact title matches
        for target_title in self.icp.target_titles:
            if target_title.lower() in title:
                score = max(score, 100)
                break

        # Check keyword matches
        keywords_matched = 0
        for keyword in self.icp.title_keywords:
            if keyword.lower() in title:
                keywords_matched += 1

        if keywords_matched > 0:
            keyword_score = min(30 + (keywords_matched * 20), 80)
            score = max(score, keyword_score)

        # Check seniority
        seniority = (prospect_data.get("seniority") or "").lower()
        for target_seniority in self.icp.target_seniority:
            if target_seniority.lower() in title or target_seniority.lower() in seniority:
                score = min(score + 15, 100)
                break

        # Check exclusions
        for exclude in self.icp.exclude_titles:
            if exclude.lower() in title:
                score = 0
                break

        return score

    def _score_company(self, company_data: dict) -> int:
        """Score company fit (0-100)"""
        if not company_data:
            return 40

        score = 50  # Base score

        # Industry match
        industry = (company_data.get("industry") or "").lower()
        for target_industry in self.icp.target_industries:
            if target_industry.lower() in industry:
                score += 25
                break

        # Company size
        employee_count = company_data.get("employee_count")
        if employee_count:
            if self.icp.company_size_min <= employee_count <= self.icp.company_size_max:
                score += 20
            elif employee_count < self.icp.company_size_min:
                score -= 15
            elif employee_count > self.icp.company_size_max:
                score -= 10

        # Location match
        location = (company_data.get("location") or company_data.get("headquarters") or "").lower()
        for target_location in self.icp.target_locations:
            if target_location.lower() in location:
                score += 10
                break

        return min(max(score, 0), 100)

    def _score_signals(self, research_data: dict) -> int:
        """Score based on positive/negative signals (0-100)"""
        if not research_data:
            return 50

        score = 50
        signals_found = research_data.get("icp_signals_found", {})

        # Add points for positive signals
        positive = signals_found.get("positive_signals", [])
        for signal in positive:
            signal_lower = signal.lower()
            for target_signal in self.icp.positive_signals:
                if target_signal.lower() in signal_lower:
                    score += 10
                    break

        # Tech stack positive signals
        tech_stack = research_data.get("tech_stack", [])
        for tech in tech_stack:
            if tech in self.icp.tech_stack_positive:
                score += 5

        # Subtract for negative signals
        negative = signals_found.get("negative_signals", [])
        for signal in negative:
            signal_lower = signal.lower()
            for bad_signal in self.icp.negative_signals:
                if bad_signal.lower() in signal_lower:
                    score -= 20
                    break

        # Tech stack negative signals
        for tech in tech_stack:
            if tech in self.icp.tech_stack_negative:
                score -= 15

        return min(max(score, 0), 100)

    def _score_triggers(self, research_data: dict) -> int:
        """Score based on trigger events (0-100)"""
        if not research_data:
            return 40

        score = 40  # Base score
        recent_news = research_data.get("recent_news", [])
        hooks = research_data.get("personalization_hooks", [])

        # Check for trigger events
        all_text = " ".join(recent_news + hooks).lower()

        for trigger in self.icp.trigger_events:
            if trigger.lower() in all_text:
                score += 15

        # Bonus for recent funding
        if "funding" in all_text or "raised" in all_text:
            score += 10

        # Bonus for hiring signals
        if "hiring" in all_text or "growing" in all_text:
            score += 5

        return min(score, 100)

    def bulk_score(self, prospects: list) -> list:
        """Score multiple prospects and return sorted by score"""
        scored = []
        for prospect in prospects:
            result = self.score_prospect(
                prospect_data=prospect.get("prospect", {}),
                company_data=prospect.get("company", {}),
                research_data=prospect.get("research", {})
            )
            scored.append({
                **prospect,
                "icp_score": result["total_score"],
                "icp_breakdown": result["breakdown"],
                "icp_recommendation": result["recommendation"]
            })

        # Sort by score descending
        return sorted(scored, key=lambda x: x["icp_score"], reverse=True)
