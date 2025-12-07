// ============================================================================
// types.ts - CAD-ready primitives with edges
// ============================================================================

// ============================================================================
// Edge Type
// ============================================================================
export type Edge = {
    id: string;
    vertices: [number, number, number][]; // 2 vertices for straight line, more for curves
    type?: 'line' | 'arc' | 'spline';
  };
  
  // ============================================================================
  // Primitive Types
  // ============================================================================
  
  export type CubePrimitive = {
    primitive: 'cube';
    id: string;
    dimensions: [number, number, number];
    position: [number, number, number];
    rotation?: [number, number, number];
    edges?: Edge[];
    color?: string;
    metadata?: Record<string, unknown>;
  };
  
  export type CylinderPrimitive = {
    primitive: 'cylinder';
    id: string;
    radiusTop: number;
    radiusBottom: number;
    height: number;
    radialSegments?: number;
    position: [number, number, number];
    rotation?: [number, number, number];
    edges?: Edge[];
    color?: string;
    metadata?: Record<string, unknown>;
  };
  
  export type SketchShape = 
    | { type: 'rectangle'; x: number; y: number; width: number; height: number }
    | { type: 'circle'; cx: number; cy: number; radius: number }
    | { type: 'polygon'; points: [number, number][] };
  
  export type SketchPrimitive = {
    primitive: 'sketch';
    id: string;
    plane: 'XY' | 'XZ' | 'YZ';
    shapes: SketchShape[];
    position?: [number, number, number];
    metadata?: Record<string, unknown>;
  };
  
  export type ExtrudePrimitive = {
    primitive: 'extrude';
    id: string;
    sketch_id: string;
    depth: number;
    direction?: [number, number, number];
    bevel?: { enabled: boolean; size: number; segments: number };
    edges?: Edge[]; // deterministically generated from sketch
    metadata?: Record<string, unknown>;
  };
  
  export type RevolvePrimitive = {
    primitive: 'revolve';
    id: string;
    sketch_id: string;
    axis: 'X' | 'Y' | 'Z' | [number, number, number];
    segments: number;
    angle?: number;
    edges?: Edge[];
    metadata?: Record<string, unknown>;
  };
  
  export type FilletPrimitive = {
    primitive: 'fillet';
    feature_id: string;
    parent_id: string;   // primitive this applies to
    edges: string[];     // edge IDs
    radius: number;
    metadata?: Record<string, unknown>;
  };
  
  export type ChamferPrimitive = {
    primitive: 'chamfer';
    feature_id: string;
    parent_id: string;
    edges: string[];
    distance: number;
    metadata?: Record<string, unknown>;
  };
  
  // ============================================================================
  // Union Types
  // ============================================================================
  
  export type PrimitiveContent = 
    | CubePrimitive 
    | CylinderPrimitive 
    | SketchPrimitive 
    | ExtrudePrimitive 
    | RevolvePrimitive 
    | FilletPrimitive 
    | ChamferPrimitive;
  
  export type Action = 'INSERT' | 'REPLACE' | 'DELETE';
  
  // ============================================================================
  // Patch Type
  // ============================================================================
  
  export type Patch = {
    feature_id: string;
    action: Action;
    content: PrimitiveContent;
  };
  
  // ============================================================================
  // Edge Generators (deterministic)
  // ============================================================================

  export function generateCubeEdges(cube: CubePrimitive, featureId: string): Edge[] {
    const [w,h,d] = cube.dimensions;
    const [x,y,z] = cube.position;
    const vertices: [number, number, number][] = [
      [x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],
      [x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]
    ];
    const edgePairs: [number,number][] = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7]
    ];
    return edgePairs.map((pair,i)=>({
      id:`${featureId}_e${i}`,
      vertices:[vertices[pair[0]],vertices[pair[1]]],
      type:'line'
    }));
  }
  
  export function generateCylinderEdges(cyl: CylinderPrimitive, featureId: string): Edge[] {
    const segments = cyl.radialSegments ?? 16;
    const edges: Edge[] = [];
    const topVertices: [number,number,number][] = [];
    const bottomVertices: [number,number,number][] = [];
    const [x,y,z] = cyl.position;
  
    for(let i=0;i<segments;i++){
      const theta = (i/segments) * Math.PI * 2;
      const xt = x + cyl.radiusTop * Math.cos(theta);
      const yt = y + cyl.radiusTop * Math.sin(theta);
      const zt = z + cyl.height;
      topVertices.push([xt,yt,zt]);
  
      const xb = x + cyl.radiusBottom * Math.cos(theta);
      const yb = y + cyl.radiusBottom * Math.sin(theta);
      const zb = z;
      bottomVertices.push([xb,yb,zb]);
    }
  
    // Top circular edges
    for(let i=0;i<segments;i++){
      edges.push({
        id:`${featureId}_top_e${i}`,
        vertices:[topVertices[i],topVertices[(i+1)%segments]],
        type:'arc'
      });
    }
  
    // Bottom circular edges
    for(let i=0;i<segments;i++){
      edges.push({
        id:`${featureId}_bottom_e${i}`,
        vertices:[bottomVertices[i],bottomVertices[(i+1)%segments]],
        type:'arc'
      });
    }
  
    // Vertical edges
    for(let i=0;i<segments;i++){
      edges.push({
        id:`${featureId}_side_e${i}`,
        vertices:[bottomVertices[i],topVertices[i]],
        type:'line'
      });
    }
  
    return edges;
  }
  
  export function generateExtrudeEdges(extrude: ExtrudePrimitive, sketchPoints: [number,number][], featureId: string): Edge[] {
    const topVertices = sketchPoints.map(([x,y]) => [x,y,extrude.depth] as [number,number,number]);
    const bottomVertices = sketchPoints.map(([x,y]) => [x,y,0] as [number,number,number]);
    const n = sketchPoints.length;
    const edges: Edge[] = [];
  
    for(let i=0;i<n;i++){
      edges.push({id:`${featureId}_top_e${i}`, vertices:[topVertices[i],topVertices[(i+1)%n]], type:'line'});
      edges.push({id:`${featureId}_bottom_e${i}`, vertices:[bottomVertices[i],bottomVertices[(i+1)%n]], type:'line'});
      edges.push({id:`${featureId}_side_e${i}`, vertices:[bottomVertices[i],topVertices[i]], type:'line'});
    }
    return edges;
  }
  
  export function generatePrimitiveEdges(
    primitive: PrimitiveContent,
    featureId: string,
    sketchPoints?: [number, number][]
  ): PrimitiveContent {
    switch (primitive.primitive) {
      case 'cube':
        primitive.edges = generateCubeEdges(primitive, featureId);
        break;
  
      case 'cylinder':
        primitive.edges = generateCylinderEdges(primitive, featureId);
        break;
  
      case 'extrude':
        if (!sketchPoints) {
          throw new Error('Extrude edges require sketch points');
        }
        primitive.edges = generateExtrudeEdges(primitive, sketchPoints, featureId);
        break;
  
      case 'revolve':
        if (!sketchPoints) {
          throw new Error('Revolve edges require sketch points');
        }
        // primitive.edges = generateRevolveEdges(primitive, sketchPoints, primitive.segments, featureId);
        break;
  
      // Sketch, fillet, chamfer do not generate edges themselves
      default:
        break;
    }
  
    return primitive;
  }
