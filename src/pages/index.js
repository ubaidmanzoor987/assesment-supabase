import { useState, useEffect } from "react";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [isAdded, setIsAdded] = useState(false);
  const [useToken, setUseToken] = useState(false);
  const [githubToken, setGithubToken] = useState("");

  async function getSupabaseProjects() {
    const { data, error } = await supabase.from("projects").select("*");
    if (error) {
      console.error("Error fetching projects:", error);
    } else {
      setProjects(data);
    }
  }

  useEffect(() => {
    async function fetchProjects() {
      await getSupabaseProjects();
    }
    fetchProjects();
  }, []);

  const handleImport = async () => {
    try {
      setIsAdded(true);
      const headers = useToken
        ? { Authorization: `Bearer ${githubToken}` }
        : {};
      const response = await axios.post(
        "/api/github-import",
        { owner, repo },
        { headers }
      );
      if (response.data.message === "Issues imported successfully") {
        await getSupabaseProjects();
        setIsAdded(false);
      }
    } catch (error) {
      console.error("Error importing issues:", error);
      setIsAdded(false);
    }
  };

  return (
    <div className="center flex-col">
      <h2 className="text-center mb-10">Import GitHub Issues</h2>
      <div className="center mt-10 flex-col gap-10">
        <div className="center">
          <input
            type="text"
            placeholder="GitHub Owner"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          />
          <input
            type="text"
            placeholder="GitHub Repo"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
          />
        </div>

        <div>
          <input
            type="checkbox"
            checked={useToken}
            onChange={() => setUseToken(!useToken)}
          />
          <label>Use GitHub Token</label>
        </div>
        {useToken && (
          <input
            type="text"
            placeholder="GitHub Token"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
          />
        )}
        <button onClick={handleImport} disabled={isAdded}>
          {isAdded === true ? <>Importing . . . </> : <>Import Issues</>}
        </button>
      </div>

      <div
        style={{
          marginTop: 20,
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: 10 }}>Projects</h1>
        <ul>
          {projects.map((project) => (
            <li key={project.id}>{project.github_link}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

