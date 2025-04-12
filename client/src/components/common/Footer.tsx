export default function Footer() {
  return (
    <footer className="bg-discord-light py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start">
            <a href="#" className="text-discord-secondary hover:text-white">Terms</a>
            <span className="mx-3 text-discord-secondary">|</span>
            <a href="#" className="text-discord-secondary hover:text-white">Privacy</a>
            <span className="mx-3 text-discord-secondary">|</span>
            <a href="#" className="text-discord-secondary hover:text-white">Help</a>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-discord-secondary text-sm text-center md:text-right">
              &copy; {new Date().getFullYear()} CryptoBotics. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
