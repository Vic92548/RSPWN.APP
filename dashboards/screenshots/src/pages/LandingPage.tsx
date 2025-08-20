import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

export default function LandingPage() {
    useEffect(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
    }, []);

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-background to-background/95">
            {/* Navigation */}
            <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Shield className="h-8 w-8 text-primary" />
                            <span className="text-2xl font-bold">VAPR Privacy Policy</span>
                        </div>
                        <a
                            href="https://vapr.club"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Back to VAPR
                        </a>
                    </div>
                </div>
            </nav>

            {/* Privacy Policy Content */}
            <section className="w-full">
                <div className="container mx-auto px-4 py-12 max-w-4xl">
                    <Card className="bg-card border-border">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
                            <CardDescription className="text-lg">
                                Your privacy matters to us
                            </CardDescription>
                            <p className="text-sm text-muted-foreground mt-2">
                                <strong>Last updated:</strong> August 9, 2025
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <section className="space-y-4">
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <span className="text-primary">1.</span> Overview
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    This Privacy Policy explains how VAPR ("we", "us") collects, uses, and protects your information when you use our Service.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <span className="text-primary">2.</span> Information We Collect
                                </h3>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Account information provided via authentication (e.g., Discord)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Content you create or upload (posts, reactions)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Usage data and analytics (e.g., device, pages visited)</span>
                                    </li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <span className="text-primary">3.</span> How We Use Information
                                </h3>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>To provide and improve the Service</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>To personalize content and features</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>To maintain security and prevent abuse</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>To communicate updates and important notices</span>
                                    </li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <span className="text-primary">4.</span> Cookies and Tracking
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    We use cookies and similar technologies for authentication, preferences, and analytics. You can control cookies through your browser settings.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <span className="text-primary">5.</span> Data Sharing
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    We may share data with trusted third-party providers (e.g., analytics, payments) to operate the Service. We do not sell personal information.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <span className="text-primary">6.</span> Data Security
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    We use reasonable safeguards to protect your information. No method of transmission or storage is completely secure.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <span className="text-primary">7.</span> Your Rights
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Depending on your location, you may have rights to access, correct, or delete your information, or object to certain processing.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <span className="text-primary">8.</span> International Transfers
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Your information may be processed in countries other than your own. We take steps to ensure appropriate protections are in place.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <span className="text-primary">9.</span> Changes to this Policy
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    We may update this Privacy Policy from time to time. Continued use of the Service after changes constitutes acceptance.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <span className="text-primary">10.</span> Contact
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    If you have questions or requests regarding this policy, contact us at{' '}
                                    <a
                                        href="mailto:support@vapr.club"
                                        className="text-primary hover:underline"
                                    >
                                        support@vapr.club
                                    </a>.
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full border-t border-border bg-background/50 mt-12">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-2 mb-4 md:mb-0">
                            <Shield className="h-6 w-6 text-primary" />
                            <span className="font-semibold">VAPR</span>
                        </div>
                        <div className="flex space-x-6 text-sm text-muted-foreground">
                            <a href="https://vapr.club" className="hover:text-foreground transition-colors">Home</a>
                            <a href="https://vapr.club/terms" className="hover:text-foreground transition-colors">Terms</a>
                            <a href="https://discord.gg/vapr" className="hover:text-foreground transition-colors">Discord</a>
                            <a href="mailto:support@vapr.club" className="hover:text-foreground transition-colors">Contact</a>
                        </div>
                    </div>
                    <div className="text-center text-sm text-muted-foreground mt-4">
                        © 2025 VAPR. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    )
}