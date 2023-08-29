import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

export default async function handler(req, res) {
  try {
    const { owner, repo } = req.body;

    const useToken = req.headers.authorization ? true : false;
    const githubToken = useToken
      ? req.headers.authorization.replace("Bearer ", "")
      : "";

    const headers = useToken ? { Authorization: `Bearer ${githubToken}` } : {};
    const githubIssuesResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      { headers }
    );
    const githubIssues = githubIssuesResponse.data;

    // Fetch or create project and insert issues into project_tasks table
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .upsert(
        [{ github_link: `https://github.com/${owner}/${repo}`, name: repo }],
        { onConflict: ["github_link"] }
      )
      .select();

    if (projectError) {
      console.log({ projectError });
      return res
        .status(500)
        .json({ error: "Error inserting project into Supabase" });
    }

    console.log({ projectData });

    const projectId = projectData[0].id;

    const tasksToInsert = githubIssues.map((issue) => ({
      project_id: projectId,
      title: issue.title,
      description: issue.body,
    }));

    const { data: tasksData, error: tasksError } = await supabase
      .from("project_tasks")
      .upsert(tasksToInsert);

    if (tasksError) {
      return res
        .status(500)
        .json({ error: "Error inserting issues into Supabase" });
    }

    return res.status(200).json({ message: "Issues imported successfully" });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({
      error: "Error fetching GitHub issues or inserting into Supabase",
    });
  }
}

