import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

export default function Hero() {
    gsap.registerPlugin(useGSAP);

    const container = useRef();
    const boxRef = useRef();

    const blobShapes = [
        {
            borderTopLeftRadius: "47% 61%",
            borderTopRightRadius: "53% 67%",
            borderBottomRightRadius: "71% 33%",
            borderBottomLeftRadius: "29% 39%",
        },
        {
            borderTopLeftRadius: "33% 35%",
            borderTopRightRadius: "67% 38%",
            borderBottomRightRadius: "75% 62%",
            borderBottomLeftRadius: "25% 65%",
        },
        {
            borderTopLeftRadius: "64% 52%",
            borderTopRightRadius: "36% 60%",
            borderBottomRightRadius: "30% 40%",
            borderBottomLeftRadius: "70% 48%",
        },
    ];

    useGSAP(
        () => {
            const tl = gsap.timeline({ repeat: -1, repeatDelay: 0, yoyo: true, delay: 0 });

            blobShapes.forEach((shape) => {
                tl.to(boxRef.current, {
                    ...shape,
                    duration: 10,
                    delay: 0,
                    ease: "sine.inOut",
                });
            });

            return () => tl.kill(); // cleanup
        },
        { scope: container }
    );

    return (
        <section className="hero-section">
            <article className="hero-section-flex">
                <div ref={container} className="container">
                    <div ref={boxRef} className="box"></div>
                </div>
                <div>
                    <h1 className="animate">Astro Pico</h1>
                    <p style={{ maxWidth: "20rem" }} className="animate">
                        I'm a minimalist theme for Astro that leaves the bare necessities, use it as
                        a blog and a place to showcase your projects and resume.
                    </p>
                </div>
            </article>
        </section>
    );
}
