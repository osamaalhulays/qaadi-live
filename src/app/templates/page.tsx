export default function TemplatesPage() {
  const files = ["secretary.md", "judge.json", "plan.md", "comparison.md"];
  return (
    <main style={{ padding: 24 }}>
      <h1 className="h1">Templates</h1>
      <ul className="list-disc" style={{ paddingLeft: 20 }}>
        {files.map((name) => (
          <li key={name}>
            <a href={`/api/templates?name=${name}`} download>
              {name}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
