import { useState, useEffect } from 'react';
import { ChevronRight, Copy, Check } from 'lucide-react';
import { Header } from '@/components/ui/header';
import { Section } from '@/components/ui/section';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { NavItem } from '@/components/ui/navItem';
import { IconButton } from '@/components/ui/iconButton';

export default function RSPWNPrivacyPage() {
    const [activeSection, setActiveSection] = useState('overview');
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
            id: 'overview',
            title: 'Overview',
            content: 'This Privacy Policy explains how RSPWN LTD ("we", "us") collects, uses, and protects your information when you use RSPWN.APP ("Service"). We are committed to protecting your privacy and ensuring the security of your personal information.'
        },
        {
            id: 'collection',
            title: 'Information We Collect',
            content: [
                'Account information provided via authentication services (e.g., Discord, Steam)',
                'Profile information you choose to provide (username, avatar, bio)',
                'Content you create or upload (posts, comments, reactions, game data)',
                'Usage data and analytics (device information, pages visited, features used)',
                'Communication preferences and settings',
                'Payment information when making purchases (processed securely via third parties)',
                'Game statistics and achievement data'
            ]
        },
        {
            id: 'use',
            title: 'How We Use Information',
            content: [
                'To provide and maintain the RSPWN gaming platform',
                'To personalize your experience and recommend content',
                'To enable social features and community interactions',
                'To process transactions and manage your purchases',
                'To communicate important updates and notifications',
                'To improve our services through analytics and feedback',
                'To maintain security and prevent abuse or fraud',
                'To comply with legal obligations and protect our rights'
            ]
        },
        {
            id: 'cookies',
            title: 'Cookies and Tracking',
            content: 'We use cookies and similar technologies for authentication, storing preferences, analytics, and improving your experience. Essential cookies are necessary for the Service to function. You can control non-essential cookies through your browser settings, though this may limit some features.'
        },
        {
            id: 'sharing',
            title: 'Data Sharing',
            content: 'We share data only as necessary to operate the Service: with trusted service providers (analytics, hosting, payments), when required by law, to protect rights and safety, or with your explicit consent. We never sell your personal information to third parties.'
        },
        {
            id: 'security',
            title: 'Data Security',
            content: 'We implement industry-standard security measures including encryption, access controls, and regular security audits. While no system is completely secure, we continuously work to protect your information from unauthorized access, alteration, or destruction.'
        },
        {
            id: 'retention',
            title: 'Data Retention',
            content: 'We retain your information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain data as required by law or for legitimate business purposes such as fraud prevention.'
        },
        {
            id: 'rights',
            title: 'Your Rights',
            content: [
                'Access your personal information and receive a copy',
                'Correct inaccurate or incomplete information',
                'Delete your account and associated data',
                'Object to or restrict certain processing activities',
                'Port your data to another service where technically feasible',
                'Withdraw consent where processing is based on consent',
                'Lodge a complaint with your local data protection authority'
            ]
        },
        {
            id: 'children',
            title: 'Children\'s Privacy',
            content: 'The Service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will promptly delete the information.'
        },
        {
            id: 'international',
            title: 'International Transfers',
            content: 'Your information may be transferred to and processed in countries other than your own, including the United Kingdom where we are based. We ensure appropriate safeguards are in place for such transfers in accordance with applicable data protection laws.'
        },
        {
            id: 'changes',
            title: 'Changes to this Policy',
            content: 'We may update this Privacy Policy periodically. We will notify you of material changes via email or prominent notice on the Service. Your continued use after changes indicates acceptance of the updated policy.'
        },
        {
            id: 'contact',
            title: 'Contact Information',
            content: 'For privacy-related questions, requests, or concerns, please contact our Data Protection Officer at privacy@rspwn.app or write to us at our registered address.'
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
                        Last updated: August 22, 2025
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
                        <div className="flex items-center gap-4 mb-4">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">Privacy Policy</h1>
                        </div>
                        <p className="text-lg sm:text-xl text-white/80 max-w-3xl">
                            Your privacy matters to us. Learn how we collect, use, and protect your information.
                        </p>
                    </Container>
                </Section>

                {/* Privacy Content */}
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
                                    <h4 className="font-semibold text-white mb-3">Data Protection Officer</h4>
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
                                    <h4 className="font-semibold text-white mb-3">Privacy Inquiries</h4>
                                    <a
                                        href="mailto:privacy@rspwn.app"
                                        className="inline-flex items-center gap-2 text-[#0f62fe] hover:text-[#0f62fe]/80 transition-colors duration-200"
                                    >
                                        privacy@rspwn.app
                                    </a>
                                    <p className="text-white/70 mt-4 text-sm">
                                        For all privacy-related questions, data access requests, or concerns about how we handle your information.
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