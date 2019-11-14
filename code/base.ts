let pong;
window.onload = function() {
    pong = new Pong(document);
}

function error(id: string, elementName: string): string {
    return `Failed to find ${elementName} element with id "${id}"`;
}
function getHTMLButton(id: string): HTMLButtonElement {
    const element = document.getElementById(id);
    if (element instanceof HTMLButtonElement)
        return element;
    throw error(id, 'html button');
}

function getSVGRectElement(svgDocument: Document, id: string): SVGRectElement {
    const element = svgDocument.getElementById(id);
    if (element instanceof SVGRectElement)
        return element;
    throw error(id, 'svg rect');
}
function getSVGTextElement(svgDocument: Document, id: string): SVGTextElement {
    const element = svgDocument.getElementById(id);
    if (element instanceof SVGTextElement)
        return element;
    throw error(id, 'svg text');
}
function getSVGCircleElement(svgDocument: Document, id: string): SVGCircleElement {
    const element = svgDocument.getElementById(id);
    if (element instanceof SVGCircleElement)
        return element;
    throw error(id, 'svg circle');
}
function getSVGAnimateMotionElement(svgDocument: Document, id: string): SVGAnimateMotionElement {
    const element = svgDocument.getElementById(id);
    if (element instanceof SVGAnimateMotionElement)
        return element;
    throw error(id, 'svg animate motion');
}
function getSVGPathElement(svgDocument: Document, id: string): SVGPathElement {
    const element = svgDocument.getElementById(id);
    if (element instanceof SVGPathElement)
        return element;
    throw error(id, 'svg path');
}