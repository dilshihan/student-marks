import React from 'react';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <p>&copy; {new Date().getFullYear()} Dilshihan. All rights reserved.</p>
                <div className="developer-info">
                    <p>Developed by <span className="dev-name">Dilshihan</span></p>
                    <div className="social-links">
                        <a href="https://www.linkedin.com/in/muhammed-dilshihan-a68737317/" target="_blank" rel="noopener noreferrer" className="social-link">
                            LinkedIn
                        </a>
                        <span className="separator">|</span>
                        <a href="https://www.instagram.com/diiilshhann._zx" target="_blank" rel="noopener noreferrer" className="social-link">
                            Instagram
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
