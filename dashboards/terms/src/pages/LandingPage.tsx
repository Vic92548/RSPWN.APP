import { useState, useEffect } from 'react';
import { ChevronRight, Copy, Check } from 'lucide-react';
import { Header } from '../components/ui/header';
import { Section } from '../components/ui/section';
import { Container } from '../components/ui/container';
import { Card } from '../components/ui/card';
import { NavItem } from '../components/ui/navItem';
import { IconButton } from '../components/ui/iconButton';

export default function RSPWNTermsPage() {
    const [activeSection, setActiveSection] = useState('agreement');
    const [copiedSection, setCopiedSection] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        // Use Intersection Observer for better performance and accuracy
        const observerOptions = {
            root: null,
            rootMargin: '-80px 0px -70% 0px', // Adjust for header and to detect when section is near top
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, observerOptions);

        // Observe all sections
        sections.forEach((section) => {
            const element = document.getElementById(section.id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            sections.forEach((section) => {
                const element = document.getElementById(section.id);
                if (element) {
                    observer.unobserve(element);
                }
            });
        };
    }, []);

    const copyToClipboard = (sectionId: string, content: string | string[]) => {
        const textContent = typeof content === 'string'
            ? content
            : content.map(item => `• ${item}`).join('\n');

        navigator.clipboard.writeText(textContent);
        setCopiedSection(sectionId);
        setTimeout(() => setCopiedSection(null), 2000);
    };

    const sections = [
        {
            id: 'agreement',
            title: 'Agreement to Terms',
            content: 'By accessing or using RSPWN.APP ("Service"), operated by RSPWN LTD (Company Number: 16236227), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.'
        },
        {
            id: 'use',
            title: 'Use of the Service',
            content: 'You must follow any policies made available within the Service. Do not misuse our Service, interfere with its operation, or access it using a method other than the interface and instructions we provide. RSPWN provides gaming software, web portal services, and retail of computer software as per our registered business activities.'
        },
        {
            id: 'accounts',
            title: 'Accounts and Security',
            content: 'You are responsible for the activity on your account and for maintaining the confidentiality of your credentials. You must be at least 13 years old to create an account. If you suspect unauthorized use of your account, notify us immediately at our registered office or via email.'
        },
        {
            id: 'content',
            title: 'User Content',
            content: 'You retain ownership of content you post. By posting content on RSPWN, you grant us a worldwide, non-exclusive, royalty-free license to use, store, reproduce, modify, create derivative works, and distribute such content for the purpose of operating and improving the Service.'
        },
        {
            id: 'prohibited',
            title: 'Prohibited Activities',
            content: [
                'Posting unlawful, harmful, or infringing content',
                'Harassment, abuse, or hate speech directed at any individual or group',
                'Attempting to bypass security measures or disrupt the Service',
                'Impersonation or misrepresentation of identity',
                'Distribution of malware, viruses, or harmful code',
                'Violation of intellectual property rights',
                'Commercial solicitation without prior written consent'
            ]
        },
        {
            id: 'ip',
            title: 'Intellectual Property',
            content: 'The Service and its original content, features, and functionality are and will remain the exclusive property of RSPWN LTD and its licensors. The RSPWN name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of RSPWN LTD.'
        },
        {
            id: 'third-party',
            title: 'Third-Party Services',
            content: 'RSPWN integrates with third-party services for authentication, payments, and other functionality. Your use of those services is subject to their respective terms and privacy policies. We are not responsible for third-party services\' practices or content.'
        },
        {
            id: 'termination',
            title: 'Termination',
            content: 'We may suspend or terminate your access to the Service at any time for violations of these Terms, to protect the Service and users, or for any other reason at our sole discretion. Upon termination, your right to use the Service will immediately cease.'
        },
        {
            id: 'disclaimers',
            title: 'Disclaimers',
            content: 'The Service is provided on an "AS IS" and "AS AVAILABLE" basis. RSPWN LTD expressly disclaims all warranties of any kind, whether express or implied. We do not warrant that the Service will be uninterrupted, secure, or error-free.'
        },
        {
            id: 'liability',
            title: 'Limitation of Liability',
            content: 'To the fullest extent permitted by UK law, RSPWN LTD and its directors, employees, partners, agents, suppliers, or affiliates, shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.'
        },
        {
            id: 'changes',
            title: 'Changes to Terms',
            content: 'We may modify these Terms from time to time. We will update the "Last updated" date at the top of this page. Your continued use of the Service after any changes indicates your acceptance of the updated Terms.'
        },
        {
            id: 'governing',
            title: 'Governing Law',
            content: 'These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts of England and Wales.'
        }
    ];

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 80; // Height of fixed header
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#2F2D2E] text-white" style={{ fontFamily: 'Lato, sans-serif' }}>
            {/* Header */}
            <Header
                scrolled={scrolled}
                onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
                menuOpen={mobileMenuOpen}
                backUrl="/"
                backLabel="Back to RSPWN"
                rightContent={
                    <span className="text-sm text-white/60 hidden sm:block">
                        Last updated: August 21, 2025
                    </span>
                }
            />

            {/* Mobile Navigation Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-[#2F2D2E]/95 backdrop-blur-sm lg:hidden">
                    <Container className="pt-20 pb-6">
                        <Card className="max-h-[70vh] overflow-y-auto">
                            <h3 className="font-semibold text-white mb-4">Contents</h3>
                            <ul className="space-y-2">
                                {sections.map((section, index) => (
                                    <li key={section.id}>
                                        <NavItem
                                            active={activeSection === section.id}
                                            onClick={() => scrollToSection(section.id)}
                                            variant="mobile"
                                        >
                                            {index + 1}. {section.title}
                                        </NavItem>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </Container>
                </div>
            )}

            {/* Main Content */}
            <main className="pt-20">
                {/* Hero Section */}
                <Section variant="hero" spacing="lg">
                    <Container>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Terms of Service</h1>
                        <p className="text-lg sm:text-xl text-white/80 max-w-3xl">
                            Please read these terms carefully before using RSPWN.APP
                        </p>
                    </Container>
                </Section>

                {/* Terms Content */}
                <Section spacing="sm">
                    <Container>
                        <div className="flex gap-8">
                            {/* Sidebar Navigation - Desktop */}
                            <nav className="hidden lg:block w-64 flex-shrink-0">
                                <div className="sticky top-24">
                                    <h3 className="font-semibold text-white mb-4">Contents</h3>
                                    <ul className="space-y-2">
                                        {sections.map((section, index) => (
                                            <li key={section.id}>
                                                <NavItem
                                                    active={activeSection === section.id}
                                                    onClick={() => scrollToSection(section.id)}
                                                >
                                                    {index + 1}. {section.title}
                                                </NavItem>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </nav>

                            {/* Main Content */}
                            <div className="flex-1 max-w-4xl">
                                <div className="space-y-6 sm:space-y-8">
                                    {sections.map((section) => (
                                        <Card
                                            key={section.id}
                                            id={section.id}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <h2 className="text-xl sm:text-2xl font-bold text-white">
                                                    {sections.findIndex(s => s.id === section.id) + 1}. {section.title}
                                                </h2>
                                                <IconButton
                                                    icon={copiedSection === section.id ? Check : Copy}
                                                    onClick={() => copyToClipboard(section.id, section.content)}
                                                    variant={copiedSection === section.id ? 'success' : 'default'}
                                                    title="Copy section"
                                                />
                                            </div>
                                            {Array.isArray(section.content) ? (
                                                <ul className="space-y-3">
                                                    {section.content.map((item, itemIndex) => (
                                                        <li key={itemIndex} className="flex items-start gap-3 text-white/80">
                                                            <ChevronRight className="w-5 h-5 text-[#0f62fe] flex-shrink-0 mt-0.5" />
                                                            <span className="text-sm sm:text-base">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-white/80 leading-relaxed text-sm sm:text-base">
                                                    {section.content}
                                                </p>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Container>
                </Section>

                {/* Contact Section */}
                <Section variant="bordered" spacing="md">
                    <Container maxWidth="lg">
                        <Card>
                            <h3 className="text-2xl font-bold text-white mb-6">Contact Information</h3>
                            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                                <div>
                                    <h4 className="font-semibold text-white mb-3">Company Details</h4>
                                    <p className="text-white/70 text-sm">
                                        RSPWN LTD<br />
                                        Company Number: 16236227<br />
                                        4th Floor, Silverstream House<br />
                                        45 Fitzroy Street<br />
                                        London, W1T 6EB<br />
                                        United Kingdom
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white mb-3">Legal Inquiries</h4>
                                    <a
                                        href="mailto:legal@rspwn.app"
                                        className="inline-flex items-center gap-2 text-[#0f62fe] hover:text-[#0f62fe]/80 transition-colors duration-200"
                                    >
                                        legal@rspwn.app
                                    </a>
                                    <p className="text-white/70 mt-4 text-sm">
                                        For questions about these Terms of Service, please contact our legal team.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </Container>
                </Section>
            </main>

            {/* Footer */}
            <footer className="bg-[#2F2D2E] border-t border-white/10 py-8 sm:py-12">
                <Container>
                    <div className="text-center">
                        <p className="text-white/60 text-sm">
                            © 2025 RSPWN LTD. All rights reserved.
                        </p>
                    </div>
                </Container>
            </footer>
        </div>
    );
}