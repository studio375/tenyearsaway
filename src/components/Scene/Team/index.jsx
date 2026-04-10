import { useStore } from "@/store/useStore";
import { useRef, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { gsap, Observer } from "@/lib/gsap";
import { useThree, useFrame } from "@react-three/fiber";
import { MathUtils, PlaneGeometry } from "three";
import Card from "./Card";

const sharedGeometry = new PlaneGeometry(1, 1, 16, 16);

export default function Team() {
  const container = useRef();
  const cards = useRef([]);
  const cardsMesh = useRef([]);
  const team = useStore((state) => state.team);
  const loaded = useStore((state) => state.loaded);
  const active = useStore((state) => state.active);
  const transition = useStore((state) => state.transition);
  const router = useRouter();
  const { size } = useThree();
  const isAbout = router.asPath.startsWith("/about");
  const staticViewport = useMemo(() => {
    const distance = 5;
    const fov = (75 * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * distance;
    const width = height * (size.width / size.height);
    const factor = size.height / height;
    return { width, height, factor };
  }, [size]);
  const [enableCarousel, setEnableCarousel] = useState(false);
  const prevActiveRef = useRef(false);
  const prevOffset = useRef(0);

  const tl = useRef(null);
  const positions = useMemo(() => {
    return team.map((_, index) => [
      staticViewport.width *
        0.7 *
        Math.cos((2 * Math.PI * index) / team.length),
      staticViewport.height *
        1.2 *
        Math.sin((2 * Math.PI * index) / team.length),
      0,
    ]);
  }, [team, staticViewport]);

  const circleParams = useMemo(() => {
    let multipliers = {
      radius: 0.764,
      spread: 1.4,
      centerYHeight: -1.05,
      centerYWidth: -0.2,
    };

    if (size.width <= 380) {
      multipliers = {
        radius: 3,
        spread: 1.2,
        centerYHeight: -1.78,
        centerYWidth: -0.02,
      };
    } else if (size.width <= 600) {
      multipliers = {
        radius: 2,
        spread: 1.6,
        centerYHeight: -1.43,
        centerYWidth: -0.02,
      };
    } else if (size.width <= 800) {
      multipliers = {
        radius: 1.9,
        spread: 1.4,
        centerYHeight: -1.5,
        centerYWidth: -0.03,
      };
    } else if (size.width <= 1024) {
      multipliers = {
        radius: 1.1,
        spread: 1.4,
        centerYHeight: -1.6,
        centerYWidth: -0.05,
      };
    }

    // 3. Calcolo finale usando i moltiplicatori stabiliti
    return {
      radius: staticViewport.width * multipliers.radius,
      spread: Math.PI * multipliers.spread,
      centerY:
        staticViewport.height * multipliers.centerYHeight -
        staticViewport.width * Math.abs(multipliers.centerYWidth), // Math.abs nel caso inserissi il segno meno nell'oggetto
    };
  }, [size.width, staticViewport]);

  const circleLayout = useMemo(() => {
    const { radius, spread, centerY } = circleParams;
    const startAngle = Math.PI / 2 - spread / 2;
    const spacing = spread / team.length;

    return team.map((_, index) => {
      const angle = startAngle + index * spacing;
      return {
        position: [
          radius * Math.cos(angle),
          centerY + radius * Math.sin(angle),
          0,
        ],
        rotation: angle - Math.PI / 2,
      };
    });
  }, [team, circleParams]);

  useEffect(() => {
    if (!loaded || !active || transition) return;
    if (!container.current || cards.current.length === 0) return;

    tl.current?.kill();
    tl.current = null;

    if (isAbout) {
      const entryDelay = prevActiveRef.current ? 0.3 : 1.5;

      container.current.visible = true;
      setEnableCarousel(false);

      tl.current = gsap.timeline({ delay: entryDelay });
      cards.current.forEach((card, index) => {
        cardsMesh.current[index].material.uniforms.uScrollForce.value = 0;
        cardsMesh.current[index].rotation.set(0, 0, 0);
        tl.current
          .to(
            card.position,
            { x: 0, y: 0, duration: 1, ease: "power3.out", delay: 0.03 },
            0,
          )
          .to(
            card.rotation,
            {
              z:
                index % 2 === 0
                  ? (Math.PI / 8) * index * 0.12
                  : -(Math.PI / 10) * index * 0.17,
              duration: 1,
              ease: "power3.out",
              delay: 0.03,
            },
            "<",
          )
          .to(
            card.position,
            {
              x: circleLayout[index].position[0],
              y: circleLayout[index].position[1],
              duration: 1,
              ease: "snake",
              delay: 0.03,
            },
            1,
          )
          .to(
            card.rotation,
            {
              z: circleLayout[index].rotation,
              x: 0,
              duration: 1,
              ease: "snake",
              delay: 0.03,
              onComplete:
                index === team.length - 1
                  ? () => setEnableCarousel(true)
                  : undefined,
            },
            1,
          );
      });
    } else {
      setEnableCarousel(false);

      tl.current = gsap.timeline({
        onComplete: () => {
          if (container.current) container.current.visible = false;
        },
      });
      cards.current.forEach((card, index) => {
        tl.current
          .to(
            card.position,
            {
              x: positions[index][0],
              y: positions[index][1],
              duration: 1,
              ease: "power3.inOut",
            },
            "<",
          )
          .to(card.rotation, { z: 0, duration: 1, ease: "power3.inOut" }, "<");
      });
    }

    prevActiveRef.current = active;

    return () => {
      tl.current?.kill();
      tl.current = null;
    };
  }, [isAbout, active, loaded, team, transition]);

  // Infinite radial carousel
  const scrollOffset = useRef(0);
  const targetOffset = useRef(0);
  const scrollForce = useRef(0);

  useEffect(() => {
    if (!enableCarousel) return;

    scrollOffset.current = 0;
    targetOffset.current = 0;
    scrollForce.current = 0;
    prevOffset.current = 0;

    const obs = Observer.create({
      target: window,
      type: "wheel,touch,pointer",
      onChangeY: (self) => {
        targetOffset.current += self.deltaY * 0.001;
      },
      onChangeX: (self) => {
        targetOffset.current -= self.deltaX * 0.001;
      },
      tolerance: 10,
      preventDefault: true,
    });

    return () => {
      obs.kill();
      scrollOffset.current = 0;
      targetOffset.current = 0;
      scrollForce.current = 0;
      prevOffset.current = 0;
    };
  }, [enableCarousel]);

  useFrame((state, delta) => {
    if (!enableCarousel) return;
    const velocity = (scrollOffset.current - prevOffset.current) / delta;
    scrollForce.current = MathUtils.damp(
      scrollForce.current,
      velocity * 0.5,
      5,
      delta,
    );
    prevOffset.current = scrollOffset.current;

    scrollOffset.current = MathUtils.lerp(
      scrollOffset.current,
      targetOffset.current,
      1 - Math.exp(-6 * delta),
    );

    const { radius, spread, centerY } = circleParams;
    const startAngle = Math.PI / 2 - spread / 2;
    const spacing = spread / team.length;
    const totalRange = team.length * spacing;

    team.forEach((_, index) => {
      const rawAngle = index * spacing + scrollOffset.current;
      const wrapped = ((rawAngle % totalRange) + totalRange) % totalRange;
      const angle = startAngle + wrapped;
      const ref = cards.current[index];
      if (ref) {
        ref.position.set(
          radius * Math.cos(angle),
          centerY + radius * Math.sin(angle),
          0,
        );
        ref.rotation.z = angle - Math.PI / 2;
      }

      const mesh = cardsMesh.current[index];
      if (mesh?.material?.uniforms) {
        mesh.material.uniforms.uScrollForce.value = scrollForce.current;
        const targetRotY = Math.sin(scrollForce.current) * (Math.PI / 6);
        mesh.rotation.y = MathUtils.damp(mesh.rotation.y, targetRotY, 8, delta);
      }
    });
  });

  if (!team || team.length === 0) return null;

  return (
    <group ref={container} visible={false}>
      {team.map((item, index) => (
        <group
          key={`team-card-${index}`}
          ref={(el) => (cards.current[index] = el)}
          position={positions[index]}
          rotation={[0, 0, 0]}
        >
          <Card
            ref={(el) => (cardsMesh.current[index] = el)}
            geometry={sharedGeometry}
            card={item}
            index={index}
            active={enableCarousel}
          />
        </group>
      ))}
    </group>
  );
}
