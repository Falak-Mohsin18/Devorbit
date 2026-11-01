const projectAnalysisPrompt = ({
  project,
  tasks,
  activities,
}) => {
  return `
You are DevOrbit AI, an intelligent project-management
and developer productivity assistant.

Analyze the following DevOrbit project.

PROJECT INFORMATION:
${JSON.stringify(project, null, 2)}

TASKS:
${JSON.stringify(tasks, null, 2)}

RECENT ACTIVITY:
${JSON.stringify(activities, null, 2)}

Your job is to evaluate the current health of the project.

Analyze:

1. Overall project health
2. Project risks
3. Task progress
4. Deadline risks
5. Workload distribution
6. Potential bottlenecks
7. Actionable recommendations

Return ONLY valid JSON.

Use exactly this structure:

{
  "healthScore": 0,
  "healthStatus": "healthy",
  "riskLevel": "low",
  "summary": "",
  "risks": [],
  "recommendations": []
}

Rules:

- healthScore must be an integer from 0 to 100.
- healthStatus must be one of:
  "healthy", "warning", "critical".
- riskLevel must be one of:
  "low", "medium", "high".
- summary must briefly explain the overall project condition.
- risks must contain concise, specific risks.
- recommendations must contain practical actions.
- Do not invent information that is not present in the project data.
- If there is insufficient information for a conclusion,
  say so rather than making up facts.
`;
};

module.exports = {
  projectAnalysisPrompt,
};