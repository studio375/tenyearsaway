import { useStore } from "@/store/useStore";
import { useThree, useFrame } from "@react-three/fiber";
import { useMemo, useState, useRef, useEffect } from "react";
import Page from "./Page";
import {
  BoxGeometry,
  MeshBasicMaterial,
  Object3D,
  Euler,
  Quaternion,
} from "three";
import gsap from "gsap";
import { easing } from "maath";
import { useRouter } from "next/router";
import { useDrag } from "@use-gesture/react";

const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30;
const sharedGeometry = new BoxGeometry(1, 1, PAGE_DEPTH, PAGE_SEGMENTS, 2);

const COVER_URL = "/textures/fullCopertina.ktx2";
const BACK_COVER_URL = "/textures/copertina-retro.ktx2";

const pageMaterials = [
  new MeshBasicMaterial({ color: "#fff" }), // Bordo Destro
  new MeshBasicMaterial({ color: "#111" }), // Bordo Sinistro (Rilegatura)
  new MeshBasicMaterial({ color: "#fff" }), // Bordo Sopra
  new MeshBasicMaterial({ color: "#fff" }), // Bordo Sotto
];

const ROT_AMP = 0.08;
const ROT_SPEED = 0.6;
const ROT_AMP_Z = 0.05;
const ROT_SPEED_Z = 0.55;
const MOUSE_INFLUENCE = 0.25;
const DAMP_SPEED = 0.15;

export default function Book() {
  const groupRef = useRef();
  const isEnabled = useRef(false);
  const isDragging = useRef(false);
  const { pages, setSelectedPage, selectedPage } = useStore();
  const activeExperience = useStore((state) => state.active);
  const [currentPage, setCurrentPage] = useState(false);
  const [prevPage, setPrevPage] = useState(false);
  const { asPath } = useRouter();

  const { size } = useThree();
  const staticViewport = useMemo(() => {
    const distance = 5;
    const fov = (75 * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * distance;
    const width = height * (size.width / size.height);
    return { width, height };
  }, [size]);

  const sizes = useMemo(() => {
    if (!pages || pages.length === 0) return { width: 1, height: 1.5 };
    const width = staticViewport.width * 0.25;
    const aspectRatio = pages[0].full.width / pages[0].full.height;
    const height = width / aspectRatio;
    return { width, height };
  }, [pages, staticViewport]);

  const textures = useMemo(() => {
    if (!pages) return [];
    const contentUrls = pages.map((p) => p.fullTexture.url);
    return [COVER_URL, ...contentUrls, BACK_COVER_URL];
  }, [pages]);

  const totalSheets = Math.ceil(textures.length / 2);
  const sheets = useMemo(
    () => Array.from({ length: totalSheets }, (_, i) => i),
    [totalSheets],
  );

  // Drag gesture for page swiping
  const bind = useDrag(
    ({ event, direction, distance, last, first, active }) => {
      if (!isEnabled.current || !activeExperience) return;
      event.stopPropagation();

      if (!active) {
        isDragging.current = false;
      }
      if (!last || distance[0] < 1.1) return;
      isDragging.current = true;
      if (direction[0] > 0) {
        setCurrentPage((prev) => {
          setPrevPage(prev);
          return Math.max(0, prev - 1);
        });
      } else {
        if (currentPage < totalSheets) {
          setCurrentPage((prev) => {
            setPrevPage(prev);
            return prev + 1;
          });
        } else {
          setPrevPage(currentPage);
          setCurrentPage(0);
        }
      }
    },
  );

  // Transizioni entrata/uscita
  const tl = useRef();
  useEffect(() => {
    if (!groupRef.current || !activeExperience) return;

    tl.current?.kill();
    tl.current = null;
    if (asPath === "/year") {
      const needsStateReset = selectedPage || selectedPage === 0;
      isEnabled.current = false;
      gsap.killTweensOf([groupRef.current.position, groupRef.current.rotation]);
      if (needsStateReset) {
        groupRef.current.visible = false;
      }
      // Reset esplicito posizione/rotazione per entrata
      gsap.set(groupRef.current.position, {
        x: -staticViewport.width,
        y: 0,
        z: 0,
      });
      gsap.set(groupRef.current.rotation, {
        x: Math.PI * 0.33,
        y: Math.PI * 0.4,
        z: 0,
      });
      groupRef.current.visible = true;

      tl.current = gsap.timeline({
        defaults: {
          duration: 1.5,
          ease: "power3.out",
          delay: 0.1,
        },
        onStart: () => {
          if (needsStateReset) {
            setCurrentPage(0);
            setSelectedPage(false);
          }
        },
        onComplete: () => {
          isEnabled.current = true;
        },
      });
      tl.current
        .to(groupRef.current.position, {
          x: -sizes.width / 2,
          y: 0,
          z: 0,
          overwrite: true,
        })
        .to(groupRef.current.rotation, { x: 0, y: 0, z: 0 }, "<");
    } else {
      if (selectedPage || selectedPage === 0) return;
      // Uscita
      tl.current = gsap.timeline({
        onStart: () => {
          isEnabled.current = false;
          setPrevPage(currentPage);
          setCurrentPage(0);
        },
        onComplete: () => {
          groupRef.current.visible = false;
        },
        defaults: {
          duration: 1.8,
          ease: "power2.inOut",
          delay: 0.1,
        },
      });
      tl.current
        .to(groupRef.current.position, {
          x: staticViewport.width,
          y: 0,
          z: 0,
        })
        .to(
          groupRef.current.rotation,
          {
            x: -Math.PI * 0.1,
            y: -Math.PI * 0.4,
            z: 0,
          },
          "<",
        );
    }

    return () => {
      tl.current?.kill();
      tl.current = null;
    };
  }, [asPath, activeExperience]);

  const tlPage = useRef();
  useEffect(() => {
    if (
      currentPage === false ||
      !isEnabled.current ||
      selectedPage ||
      selectedPage === 0 ||
      !activeExperience
    )
      return;

    tlPage.current?.kill();
    tlPage.current = null;
    tlPage.current = gsap.timeline({
      defaults: {
        duration: 0.8,
        ease: "power2.out",
        overwrite: true,
      },
    });
    if (currentPage == 0) {
      tlPage.current.to(groupRef.current.position, {
        x: -sizes.width / 2,
        y: 0,
        z: 0,
      });
    } else if (currentPage == totalSheets) {
      tlPage.current.to(groupRef.current.position, {
        x: sizes.width / 2,
        y: 0,
        z: 0,
      });
    } else {
      if (groupRef.current.position.x !== -sizes.width / 2) {
        tlPage.current.to(groupRef.current.position, { x: 0, y: 0, z: 0 });
      }
    }
    return () => {
      tlPage.current?.kill();
      tlPage.current = null;
    };
  }, [currentPage, activeExperience]);

  const resetBook = () => {
    setPrevPage(currentPage);
    setCurrentPage(0);
    isEnabled.current = false;
    groupRef.current.position.set(-staticViewport.width, 0, 0);
    groupRef.current.rotation.set(Math.PI * 0.33, Math.PI * 0.4, 0);
    groupRef.current.visible = false;
    setSelectedPage(false);
  };

  const dummy = useMemo(() => new Object3D(), []);
  const targetEuler = useRef(new Euler(0, 0, 0, "XYZ"));
  const targetQuat = useRef(new Quaternion());

  useFrame(({ clock, pointer, delta }) => {
    if (!isEnabled.current || !groupRef.current.visible || !activeExperience)
      return;
    const t = clock.getElapsedTime();

    const idleX = Math.sin(t * ROT_SPEED) * ROT_AMP;
    const idleZ = Math.cos(t * ROT_SPEED_Z) * ROT_AMP_Z;

    dummy.lookAt(pointer.x * 0.6, pointer.y * 0.6, 1);

    const e = targetEuler.current;
    e.x = idleX + dummy.rotation.x * MOUSE_INFLUENCE;
    e.y = dummy.rotation.y * MOUSE_INFLUENCE;
    e.z = idleZ + dummy.rotation.z * MOUSE_INFLUENCE;
    targetQuat.current.setFromEuler(e);

    easing.dampQ(
      groupRef.current.quaternion,
      targetQuat.current,
      DAMP_SPEED,
      delta,
    );
  });

  if (!pages || pages.length === 0) return null;

  return (
    <group ref={groupRef} visible={false} {...bind()}>
      {sheets.map((sheetIndex) => {
        const frontUrl = textures[sheetIndex * 2];
        const backUrl = textures[sheetIndex * 2 + 1];
        return (
          <Page
            key={`sheet-${sheetIndex}`}
            index={sheetIndex}
            geometry={sharedGeometry}
            pageMaterials={pageMaterials}
            sizes={sizes}
            frontUrl={frontUrl}
            backUrl={backUrl}
            opened={currentPage > sheetIndex}
            currentPage={currentPage}
            prevPage={prevPage}
            totalSheets={totalSheets}
            selectedPage={selectedPage}
            setSelectedPage={setSelectedPage}
            isDragging={isDragging}
            isEnabled={isEnabled}
            year={
              currentPage > sheetIndex && sheetIndex !== 0
                ? pages[sheetIndex + 1].year
                : pages[sheetIndex].year
            }
            resetBook={() => resetBook()}
          />
        );
      })}
    </group>
  );
}
