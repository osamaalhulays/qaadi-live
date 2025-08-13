export default function Footer() {
  return (
    <footer className="footer" style={{marginTop:24, textAlign:"center"}}>
      <small>© {new Date().getFullYear()} Qaadi</small>
      <span style={{margin: "0 8px"}}>|</span>
      <a href="mailto:contact@qaadi.live">اتصل بنا</a>
    </footer>
  );
}
