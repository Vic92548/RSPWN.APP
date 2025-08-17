import { Card, CardContent } from "@/components/ui/card"

export default function LandingPage() {
    return (
        <div className="min-h-screen w-full bg-background">
            {/* Simple Header */}
            <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-center">
                        <h1 className="text-3xl font-bold">VAPR Terms of Service</h1>
                    </div>
                </div>
            </header>

            {/* Terms Content */}
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <Card className="bg-card border-border">
                    <CardContent className="prose prose-invert max-w-none p-8">
                        <div className="text-sm text-muted-foreground mb-6">
                            <p><strong>Last updated:</strong> August 9, 2025</p>
                        </div>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
                            <p className="text-muted-foreground">
                                By accessing or using VAPR ("Service"), you agree to be bound by these Terms of Service ("Terms").
                                If you do not agree to these Terms, do not use the Service.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">2. Use of the Service</h2>
                            <p className="text-muted-foreground">
                                You must follow any policies made available within the Service. Do not misuse our Service,
                                interfere with its operation, or access it using a method other than the interface and
                                instructions we provide.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">3. Accounts and Security</h2>
                            <p className="text-muted-foreground">
                                You are responsible for the activity on your account and for maintaining the confidentiality
                                of your credentials. If you suspect unauthorized use of your account, notify us immediately.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
                            <p className="text-muted-foreground">
                                You retain ownership of content you post. By posting content on VAPR, you grant us a
                                worldwide, non-exclusive, royalty-free license to use, store, reproduce, modify, create
                                derivative works, and distribute such content for the purpose of operating and improving
                                the Service.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">5. Prohibited Activities</h2>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>Posting unlawful, harmful, or infringing content</li>
                                <li>Harassment, abuse, or hate speech</li>
                                <li>Attempting to bypass security or disrupt the Service</li>
                                <li>Impersonation or misrepresentation</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
                            <p className="text-muted-foreground">
                                The Service and its original content, features, and functionality are and will remain
                                the exclusive property of VAPR and its licensors. Trademarks and brands belong to their
                                respective owners.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">7. Third-Party Services</h2>
                            <p className="text-muted-foreground">
                                VAPR integrates with third-party services (e.g., Discord for authentication, Tebex for
                                commerce). Your use of those services may be subject to their own terms.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
                            <p className="text-muted-foreground">
                                We may suspend or terminate your access to the Service at any time for violations of
                                these Terms or to protect the Service and users.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">9. Disclaimers</h2>
                            <p className="text-muted-foreground">
                                The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We do not warrant that
                                the Service will be uninterrupted, secure, or error-free.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
                            <p className="text-muted-foreground">
                                To the fullest extent permitted by law, VAPR and its affiliates are not liable for any
                                indirect, incidental, special, consequential, or punitive damages, or any loss of profits
                                or revenues.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">11. Changes to the Terms</h2>
                            <p className="text-muted-foreground">
                                We may modify these Terms from time to time. We will update the "Last updated" date above.
                                Continued use of the Service after changes means you accept the revised Terms.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
                            <p className="text-muted-foreground">
                                If you have questions about these Terms, contact us at{' '}
                                <a href="mailto:support@vapr.club" className="text-primary hover:underline">
                                    support@vapr.club
                                </a>.
                            </p>
                        </section>
                    </CardContent>
                </Card>

                {/* Footer */}
                <footer className="mt-12 py-8 text-center">
                    <div className="text-sm text-muted-foreground">
                        <a href="/" className="hover:text-foreground transition-colors">Back to VAPR</a>
                        <span className="mx-2">•</span>
                        <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
                    </div>
                </footer>
            </main>
        </div>
    )
}