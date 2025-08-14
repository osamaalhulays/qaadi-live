export default function Footer() {
  return (
    <footer className="mt-6 text-center text-sm">
      <small>© {new Date().getFullYear()} Qaadi</small>
      <span className="mx-2">|</span>
      <a href="mailto:contact@qaadi.live" className="underline">اتصل بنا</a>
    </footer>
  );
}
