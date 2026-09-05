/* Geometry construction is isolated from scrolling, pointer input and the intro. */
'use strict';
importScripts('vendor/three.min.js?v=20260903-3');
self.onmessage = ({ data }) => {
  try {
    const { contours } = data;
    const THREE = self.THREE;
    const large = shape => {
      const xs = shape.outer.map(p => p[0]), ys = shape.outer.map(p => p[1]);
      return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) > 90;
    };
    const points = path => path.map(([x, y]) => new THREE.Vector2((x / contours.size - .5) * 4.4, (.5 - y / contours.size) * 4.4));
    const meshes = [];
    for (const color of ['yellow', 'silver']) for (const major of [true, false]) {
      const shapes = contours[color].filter(shape => large(shape) === major).map(contour => {
        const shape = new THREE.Shape(points(contour.outer));
        shape.holes = contour.holes.map(hole => new THREE.Path(points(hole)));
        return shape;
      });
      const geometry = new THREE.ExtrudeGeometry(shapes, {
        depth: major ? (color === 'yellow' ? .055 : .04) : .012,
        steps: 1, bevelEnabled: true, bevelThickness: major ? .007 : .0018,
        bevelSize: major ? .005 : .0012, bevelSegments: 2, curveSegments: 1
      });
      // Smooth the bevel/side contour normals to remove raster stair-step facets,
      // but isolate the planar caps. UVs are unnecessary: there is no image map.
      const position = geometry.attributes.position.array;
      const normal = geometry.attributes.normal.array;
      const unique = new Map(), positions = [], indices = [];
      for (let i = 0; i < position.length; i += 3) {
        const key = [position[i], position[i + 1], position[i + 2]].map(v => Math.round(v * 100000)).join(',') + (Math.abs(normal[i + 2]) > .999 ? ':cap' : ':side');
        let index = unique.get(key);
        if (index === undefined) {
          index = positions.length / 3;
          unique.set(key, index);
          positions.push(position[i], position[i + 1], position[i + 2]);
        }
        indices.push(index);
      }
      const indexed = new THREE.BufferGeometry();
      indexed.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      indexed.setIndex(indices);
      indexed.computeVertexNormals();
      meshes.push({ color, major, positions: indexed.attributes.position.array, normals: indexed.attributes.normal.array, indices: new Uint32Array(indices) });
      indexed.dispose();
      geometry.dispose();
    }
    self.postMessage({ meshes }, meshes.flatMap(mesh => [mesh.positions.buffer, mesh.normals.buffer, mesh.indices.buffer]));
  } catch (error) { self.postMessage({ error: error.message }); }
};
