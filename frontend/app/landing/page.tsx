"use client";

import { useState } from 'react';
import { ArrowRight, CheckCircle, Users, TrendingUp, Shield, Zap, Heart, MessageCircle, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function LandingPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');

    const features = [
        {
            icon: Users,
            title: 'Share Anonymously',
            description: 'Share your failures without fear. Use anonymous aliases to protect your identity.',
        },
        {
            icon: TrendingUp,
            title: 'Learn & Grow',
            description: 'Learn from others\' mistakes. Turn failures into valuable lessons.',
        },
        {
            icon: Shield,
            title: 'Safe Community',
            description: 'AI-powered moderation ensures a supportive, judgment-free environment.',
        },
        {
            icon: Zap,
            title: 'Phoenix Score',
            description: 'Earn points for sharing and helping others. Rise from your failures.',
        },
    ];

    const stats = [
        { number: '10K+', label: 'Stories Shared' },
        { number: '50K+', label: 'Community Members' },
        { number: '95%', label: 'Feel Supported' },
        { number: '4.9/5', label: 'User Rating' },
    ];

    const testimonials = [
        {
            name: 'Sarah Chen',
            role: 'Startup Founder',
            content: 'Sharing my startup failure here helped me process it and move forward. The community support was incredible.',
            avatar: '👩‍💼',
        },
        {
            name: 'Michael Rodriguez',
            role: 'Software Engineer',
            content: 'I learned more from reading others\' failures than from any success story. This platform is a goldmine.',
            avatar: '👨‍💻',
        },
        {
            name: 'Emily Watson',
            role: 'Product Manager',
            content: 'The anonymous feature gave me the courage to share. Now I help others avoid the same mistakes.',
            avatar: '👩‍🎨',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
                <div className="container-custom max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                <Heart className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <span className="text-xl font-bold text-foreground">Openly</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/login')}
                                className="btn-secondary"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => router.push('/signup')}
                                className="btn-primary"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="container-custom max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
                            Turn Your <span className="text-primary">Failures</span> Into
                            <br />
                            Valuable Lessons
                        </h1>
                        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Join a supportive community where failures are celebrated as stepping stones to success.
                            Share anonymously, learn from others, and grow together.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => router.push('/signup')}
                                className="btn-primary text-lg px-8 py-4"
                            >
                                Start Sharing
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </button>
                            <button
                                onClick={() => router.push('/login')}
                                className="btn-secondary text-lg px-8 py-4"
                            >
                                Explore Stories
                            </button>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
                    >
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                                <div className="text-sm text-muted-foreground">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-4 bg-muted/30">
                <div className="container-custom max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-foreground mb-4">
                            Why Choose Openly?
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            A safe space designed to help you learn, grow, and connect through shared experiences.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="card-simple p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                        <Icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-4">
                <div className="container-custom max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-foreground mb-4">
                            How It Works
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Three simple steps to start your journey
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Create Account', desc: 'Sign up in seconds. Choose to share openly or anonymously.' },
                            { step: '02', title: 'Share Your Story', desc: 'Write about your failure. Be honest, be vulnerable, be real.' },
                            { step: '03', title: 'Learn & Connect', desc: 'Read others\' stories, offer support, and grow together.' },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.2 }}
                                viewport={{ once: true }}
                                className="relative"
                            >
                                <div className="text-6xl font-bold text-primary/20 mb-4">{item.step}</div>
                                <h3 className="text-2xl font-semibold text-foreground mb-2">{item.title}</h3>
                                <p className="text-muted-foreground">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 px-4 bg-muted/30">
                <div className="container-custom max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-foreground mb-4">
                            What Our Community Says
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="card-simple p-6"
                            >
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                    ))}
                                </div>
                                <p className="text-foreground mb-4 italic">"{testimonial.content}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">{testimonial.avatar}</div>
                                    <div>
                                        <div className="font-semibold text-foreground">{testimonial.name}</div>
                                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="container-custom max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="card-simple p-12 text-center bg-gradient-to-br from-primary/10 to-primary/5"
                    >
                        <h2 className="text-4xl font-bold text-foreground mb-4">
                            Ready to Turn Failures Into Growth?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8">
                            Join thousands who are learning, growing, and succeeding together.
                        </p>
                        <button
                            onClick={() => router.push('/signup')}
                            className="btn-primary text-lg px-8 py-4"
                        >
                            Get Started for Free
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-border">
                <div className="container-custom max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                    <Heart className="w-5 h-5 text-primary-foreground" />
                                </div>
                                <span className="text-lg font-bold text-foreground">Openly</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                A safe space to share failures and grow together.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-primary">Features</a></li>
                                <li><a href="#" className="hover:text-primary">Pricing</a></li>
                                <li><a href="#" className="hover:text-primary">FAQ</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-primary">About</a></li>
                                <li><a href="#" className="hover:text-primary">Blog</a></li>
                                <li><a href="#" className="hover:text-primary">Careers</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-primary">Privacy</a></li>
                                <li><a href="#" className="hover:text-primary">Terms</a></li>
                                <li><a href="#" className="hover:text-primary">Guidelines</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
                        © 2024 Openly. All rights reserved. Built with ❤️ for those who dare to fail.
                    </div>
                </div>
            </footer>
        </div>
    );
}
