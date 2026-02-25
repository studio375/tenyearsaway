import { useStore } from "@/store/useStore";
import { useMemo, useRef, useEffect } from "react";
import gsap from "gsap";
import { useThree } from "@react-three/fiber";
import { comicLayouts } from "@/assets/data";
import { generateGridPositions } from "@/helpers/functions";
import { useLenis } from "lenis/react";
import { useRouter } from "next/router";
export default function TransitionHandler() {
  const {
    objects,
    transition,
    setTransition,
    activeYear,
    clearObjects,
    setYearData,
    background,
  } = useStore();
  const { camera, viewport } = useThree();
  const lenis = useLenis();
  const router = useRouter();
  const transitionTl = useRef(null);
  const finalTargets = useMemo(() => {
    if (!comicLayouts[activeYear]) return [];
    return generateGridPositions(comicLayouts[activeYear]);
  }, [activeYear]);

  useEffect(() => {
    if (!transition) return;
    if (transition === "next" && finalTargets.length > 0) {
      const nextYear = parseInt(activeYear) + 1;
      transitionTl.current = gsap.timeline({
        onComplete: () => {
          clearObjects();
          requestAnimationFrame(() => {
            router.push(`/year/${nextYear}`);
            lenis.start();
            lenis.resize();
          });
        },
      });

      const tl = transitionTl.current;

      // Scroll
      lenis.stop();

      // Camera
      const layoutSettings = comicLayouts[activeYear].settings;
      const fov = camera.fov * (Math.PI / 180);
      const targetZ =
        Math.abs(layoutSettings.pageHeight / (2 * Math.tan(fov / 2))) * 1.15;

      tl.to(
        camera.position,
        {
          z: targetZ,
          duration: 1.5,
          ease: "power3.inOut",
        },
        0,
      ).to(
        background.material.uniforms.uAlpha,
        { value: 0, duration: 2, ease: "power2.out", delay: 0.75 },
        1,
      );

      // Objects
      objects.forEach(({ ref, index, type }) => {
        if (type == "page") {
          const page = ref;
          page.position.set(camera.position.x, camera.position.y, -2);
          page.visible = true;
          tl.to(
            page.position,
            {
              z: 0,
              duration: 2,
              ease: "power2.out",
              delay: 0.7,
            },
            1,
          )
            .to(
              page.material.uniforms.uProgress,
              { value: 1, duration: 2.8, ease: "power2.out", delay: 0.7 },
              1,
            )
            .to(
              page.material.uniforms.uLightProgress,
              { value: 1.0, duration: 2.1, ease: "power2.out", delay: 1.3 },
              1,
            )
            .to(
              page.position,
              {
                y: page.position.y + viewport.height / 2 + page.scale.y / 1.5,
                duration: 1.5,
                ease: "expo.inOut",
              },
              "<=80%",
            );
        }
        if (type == "frame") {
          const mesh = ref;
          if (finalTargets[index]) {
            const target = finalTargets[index];
            let finalWidth = target.width;
            let finalHeight = target.height;
            tl.to(
              mesh.position,
              {
                x: camera.position.x + target.x,
                y: camera.position.y + target.y,
                z: 0,
                duration: 1.8,
                ease: "expo.inOut",
              },
              0,
            )
              .to(
                mesh.scale,
                {
                  x: finalWidth,
                  y: finalHeight,
                  duration: 1.8,
                  ease: "expo.inOut",
                },
                0,
              )
              .to(
                mesh.position,
                {
                  z: -2,
                  duration: 1.9,
                  ease: "power2.out",
                  delay: 0.7,
                },
                1,
              )
              .to(
                mesh.material.uniforms.uLightProgress,
                { value: 1.0, duration: 1.8, ease: "power2.out", delay: 0.7 },
                1,
              )
              .to(
                mesh.material.uniforms.uProgress,
                {
                  value: 0,
                  duration: 1,
                  ease: "power2.out",
                  overwrite: true,
                  onComplete: () => {
                    mesh.visible = false;
                  },
                },
                "<=80%",
              );
          }
        }
        if (type == "caption") {
          const caption = ref;
          tl.to(
            caption.material.uniforms.uProgress,
            { value: 0, duration: 1.2, ease: "power2.out", overwrite: true },
            0,
          );
        }
      });
    }

    if (transition === "exit") {
      lenis.stop();
      transitionTl.current = gsap.timeline({
        onComplete: () => {
          setYearData(null, [], null);
          clearObjects();
          setTransition(false);
          requestAnimationFrame(() => {
            camera.position.set(0, 0, 5);
            lenis.resize();
            lenis.start();
            lenis.scrollTo(0, { immediate: true });
          });
        },
      });
      transitionTl.current
        .to(camera.position, {
          x: 0,
          y: 0,
          z: 5,
          duration: 1.5,
          overwrite: true,
          ease: "power2.out",
        })
        .to(
          background.material.uniforms.uMovement,
          {
            value: 0,
            duration: 1.5,
            ease: "power2.out",
          },
          "<",
        )
        .to(
          background.material.uniforms.uSpeed,
          {
            value: 0,
            duration: 1.5,
            ease: "power2.out",
          },
          "<",
        );
      objects.forEach(({ ref, index, type }) => {
        transitionTl.current
          .to(
            ref.position,
            {
              z: -2,
              duration: 1.2,
              overwrite: true,
              ease: "power2.out",
            },
            "<",
          )
          .to(
            ref.material.uniforms.uProgress,
            {
              value: 0,
              duration: 1.2,
              overwrite: true,
              ease: "power2.out",
            },
            "<",
          );
      });
    }

    return () => {
      if (transitionTl.current) {
        transitionTl.current.kill();
        transitionTl.current = null;
      }
    };
  }, [transition]);

  return null;
}
