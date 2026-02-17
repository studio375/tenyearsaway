import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

export default function SceneStats() {
  const { gl } = useThree();

  useEffect(() => {
    setTimeout(() => {
      const info = gl.info;
      console.log({
        geometries: info.memory.geometries,
        textures: info.memory.textures,
        programs: info.programs?.length,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        points: info.render.points,
        lines: info.render.lines,
      });
    }, 5000);
  }, [gl.info]);

  return null;
}
