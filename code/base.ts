let pong;
window.onload = function() {
    const [object, content] = this.getDocumentOfHTMLObject('pong-svg-object');
    if (window.chrome && object.parentElement != null) {
        console.log('is chrome');
        object.parentElement.removeChild(object);
        let div = document.getElementById('chrome-svg-container');
        if (div instanceof this.HTMLElement &&
            content.firstChild !== null)
        {
            div.innerHTML = content.documentElement.outerHTML;
        }
        pong = new Pong(document);
    } else
        pong = new Pong(content);
}

function error(id: string, elementName: string): string {
    return `Failed to find ${elementName} element with id "${id}"`;
}
function getDocumentOfHTMLObject(id: string): [HTMLObjectElement, Document] {
    const element = document.getElementById(id);
    if (element instanceof HTMLObjectElement) {
        const content = element.contentDocument;
        if (content !== null)
            return [element, content];
        throw `document of ${id} is empty`;
    }
    throw error(id, 'html object');
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