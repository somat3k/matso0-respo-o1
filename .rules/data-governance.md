# Data Governance Rules

Data classes:
- public market/reference data,
- licensed market/vendor data,
- internal analytics,
- user-sensitive runtime data,
- credentials and secrets.

Rules:
- annotate source and usage rights,
- separate raw, normalized, feature, and model artifact layers,
- store retention policies by dataset class,
- track provenance for generated signals and evaluations,
- deny default access to sensitive stores,
- avoid using restricted data for outputs that violate vendor terms.
