import type { Patch, PrimitiveContent, ExtrudePrimitive } from './types';
import { generatePrimitiveEdges } from './types';

/**
 * Core DSL parser for array of lines, auto-generating edges for primitives
 */
function parseDSLLines(lines: string[], sourceName = 'DSL'): Patch[] {
    return lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map((line, i) => {
            const match = line.match(/^AT\s+(\S+)\s+(\S+)\s+([\s\S]+)$/);
            if (!match) throw new Error(`[${sourceName}] Invalid DSL line ${i + 1}: ${line}`);

            const [, feature_id, action, content] = match;
            let parsedContent: PrimitiveContent;
            try {
                parsedContent = JSON.parse(content);
            } catch (err) {
                throw new Error(`[${sourceName}] Invalid JSON on line ${i + 1}: ${err}`);
            }

            // Auto-generate edges for primitives that support them
            if (parsedContent.primitive === 'extrude') {
                const sketchPoints: [number, number][] | undefined = 
                    (parsedContent as ExtrudePrimitive).metadata?.sketchPoints as [number, number][] | undefined;
                if (!sketchPoints) {
                    throw new Error(`[${sourceName}] Extrude missing sketchPoints on line ${i + 1}`);
                }
                parsedContent = generatePrimitiveEdges(parsedContent, feature_id, sketchPoints);
            } else if (parsedContent.primitive === 'revolve') {
                const sketchPoints: [number, number][] | undefined = 
                    parsedContent.metadata?.sketchPoints as [number, number][] | undefined;
                if (!sketchPoints) {
                    throw new Error(`[${sourceName}] Revolve missing sketchPoints on line ${i + 1}`);
                }
                parsedContent = generatePrimitiveEdges(parsedContent, feature_id, sketchPoints);
            } else {
                parsedContent = generatePrimitiveEdges(parsedContent, feature_id);
            }

            return {
                feature_id,
                action: action as 'INSERT' | 'REPLACE' | 'DELETE',
                content: parsedContent
            } as Patch;
        });
}

/**
 * Parses a line-based DSL file into an array of patches, auto-generating edges.
 */

/**
 * Converts a line-based DSL string directly to JSON array, auto-generating edges.
 */
export function parseDSLString(dslString: string): Patch[] {
    const lines = dslString.split(/\r?\n/);
    return parseDSLLines(lines, 'DSL string');
}
