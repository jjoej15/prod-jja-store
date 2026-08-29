import ArrowIcon from "./arrow-icon";

type FooterItem = {
  text: string;
  href: string;
};

export default function Footer() {
  const footerItems: FooterItem[] = [
    { text: "ig", href: "https://www.instagram.com/jj.aholics/" },
    { text: "yt", href: "https://youtube.com/@jj.aholics?si=df83asAtW0GnMQfY" },
    { text: "sc", href: "https://soundcloud.com/jjaholics" },
  ]

  return (
    <footer className="mb-24">
      <ul className="font-sm mt-8 flex text-neutral-800 flex-row space-x-4 space-y-0">
        {footerItems.map(f =>
          <li key={f.text + "_" + f.href}>
            <a
              className="flex items-center transition-all hover:text-neutral-800"
              rel="noopener noreferrer"
              target="_blank"
              href={f.href}
            >
              <ArrowIcon />
              <p className="ml-2 h-7">{f.text}</p>
            </a>
          </li>
        )}
      </ul>
      <p className="mt-8 text-neutral-800">
        © {new Date().getFullYear()} joe anderson
      </p>
    </footer>
  )
}
