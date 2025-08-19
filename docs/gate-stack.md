# Gate Stack

The Qaadi pipeline enforces four sequential gates. A draft must satisfy each gate before moving to the next stage.

1. **Secretary Gate**
   - Requires the following fields:
     - summary
     - keywords
     - tokens
     - boundary
     - post-analysis
     - risks
     - predictions
     - testability

2. **QN21 Gate**
   - Runs the 21-criterion evaluation.
   - Needs at least 60% total score with no failed critical criteria.

3. **Consultant Gate**
   - Ensures a recommendation and review notes from a consultant.

4. **Publication Gate**
   - Final check before release; confirms previous gates passed and includes final approval.

If any gate fails, the workflow stops and reports the missing requirements.
