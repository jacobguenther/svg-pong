"use strict";
let pong;
window.onload = function () {
    const [object, content] = this.getDocumentOfHTMLObject('pong-svg-object');
    if (window.chrome && object.parentElement != null) {
        console.log('is chrome');
        object.parentElement.removeChild(object);
        let div = document.getElementById('chrome-svg-container');
        if (div instanceof this.HTMLElement &&
            content.firstChild !== null) {
            div.innerHTML = content.documentElement.outerHTML;
        }
        pong = new Pong(document);
    }
    else
        pong = new Pong(content);
};
function error(id, elementName) {
    return `Failed to find ${elementName} element with id "${id}"`;
}
function getDocumentOfHTMLObject(id) {
    const element = document.getElementById(id);
    if (element instanceof HTMLObjectElement) {
        const content = element.contentDocument;
        if (content !== null)
            return [element, content];
        throw `document of ${id} is empty`;
    }
    throw error(id, 'html object');
}
function getHTMLButton(id) {
    const element = document.getElementById(id);
    if (element instanceof HTMLButtonElement)
        return element;
    throw error(id, 'html button');
}
function getSVGRectElement(svgDocument, id) {
    const element = svgDocument.getElementById(id);
    if (element instanceof SVGRectElement)
        return element;
    throw error(id, 'svg rect');
}
function getSVGTextElement(svgDocument, id) {
    const element = svgDocument.getElementById(id);
    if (element instanceof SVGTextElement)
        return element;
    throw error(id, 'svg text');
}
function getSVGCircleElement(svgDocument, id) {
    const element = svgDocument.getElementById(id);
    if (element instanceof SVGCircleElement)
        return element;
    throw error(id, 'svg circle');
}
function getSVGAnimateMotionElement(svgDocument, id) {
    const element = svgDocument.getElementById(id);
    if (element instanceof SVGAnimateMotionElement)
        return element;
    throw error(id, 'svg animate motion');
}
function getSVGPathElement(svgDocument, id) {
    const element = svgDocument.getElementById(id);
    if (element instanceof SVGPathElement)
        return element;
    throw error(id, 'svg path');
}
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    clone() {
        return new Vec2(this.x, this.y);
    }
    add(other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    }
    sub(other) {
        return new Vec2(this.x - other.x, this.y - other.y);
    }
    mul(s) {
        return new Vec2(this.x * s, this.y * s);
    }
    div(s) {
        return new Vec2(this.x / s, this.y / s);
    }
    cross(other) {
        return this.x * other.y - this.y * other.x;
    }
    magnitude2() {
        return this.x * this.x + this.y * this.y;
    }
    magnitude() {
        return Math.sqrt(this.magnitude2());
    }
    numberAsString(n) {
        if (n == Math.floor(n)) {
            return n.toString();
        }
        else {
            return n.toFixed(2);
        }
    }
    asString() {
        return `${this.numberAsString(this.x)},${this.numberAsString(this.y)} `;
    }
    asAbsolute() {
        return `M${this.asString()}`;
    }
    asLine() {
        return `L${this.asString()}`;
    }
}
class Line {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }
}
class PongElements {
    constructor(svgContent) {
        this.playerPaddle = getSVGRectElement(svgContent, 'pong-player-paddle');
        this.aiPaddle = getSVGRectElement(svgContent, 'pong-ai-paddle');
        this.playerScoreElement = getSVGTextElement(svgContent, 'pong-player-score');
        this.aiScoreElement = getSVGTextElement(svgContent, 'pong-ai-score');
        this.ball = getSVGCircleElement(svgContent, 'pong-ball');
        this.ballAnimation = getSVGAnimateMotionElement(svgContent, 'pong-ball-animation');
        this.ballPath = getSVGPathElement(svgContent, 'pong-ball-path');
        this.collisionPath = getSVGPathElement(svgContent, 'pong-collision-path');
        this.resetButton = getHTMLButton('pong-reset');
        this.serveButton = getHTMLButton('pong-serve');
    }
}
class Pong {
    constructor(svgContent) {
        this.width = 512;
        this.height = 256;
        this.center = new Vec2(this.width / 2, this.height / 2);
        this.paddleWidth = 2;
        this.paddleHeight = 28;
        this.ballRadius = 3;
        this.paddleVelocity = 60;
        this.playerStartingPosition = new Vec2(0, this.center.y - this.paddleHeight / 2);
        this.aiStartingPosition = new Vec2(this.width - this.paddleWidth, this.center.y - this.paddleHeight / 2);
        this.corners = [
            new Vec2(-this.ballRadius, this.ballRadius),
            new Vec2(this.width + this.ballRadius, this.ballRadius),
            new Vec2(this.width + this.ballRadius, this.height - this.ballRadius),
            new Vec2(-this.ballRadius, this.height - this.ballRadius)
        ];
        this.bounds = [
            [new Line(this.corners[0], this.corners[1]), false],
            [new Line(this.corners[0], this.corners[3]), true],
            [new Line(this.corners[3], this.corners[2]), false],
            [new Line(this.corners[1], this.corners[2]), true]
        ];
        this.paddleBounds = [
            this.bounds[0][0],
            new Line(new Vec2(this.paddleWidth + this.ballRadius, 0), new Vec2(this.paddleWidth + this.ballRadius, this.height)),
            this.bounds[2][0],
            new Line(new Vec2(this.width - this.paddleWidth - this.ballRadius, 0), new Vec2(this.width - this.paddleWidth - this.ballRadius, this.height))
        ];
        this.lastAnimationFrame = 0;
        this.playerPosition = this.playerStartingPosition.clone();
        this.aiPosition = this.aiStartingPosition.clone();
        this.ballVelocity = new Vec2(0, 0);
        this.running = false;
        this.shouldServe = false;
        this.time = 0;
        this.lastTime = 0;
        this.serveTime = 0;
        this.playerScore = 0;
        this.aiScore = 0;
        this.scoreDur = 0;
        this.collisionDur = 0;
        this.collisionPoint = new Vec2(0, 0);
        this.moveUp = false;
        this.moveDown = false;
        console.log('constructor');
        this.elements = new PongElements(svgContent);
        this.elements.resetButton.addEventListener('click', () => { this.reset(); });
        this.elements.serveButton.addEventListener('click', () => { this.start(); });
        document.addEventListener('keydown', (event) => { this.handleKeyboard(event); });
    }
    get deltaT() { return (this.time - this.lastTime) / 1000; }
    get timeSinceServe() { return (this.time - this.serveTime) / 1000; }
    start() {
        if (!this.running) {
            this.running = true;
            this.shouldServe = true;
            this.lastAnimationFrame = window.requestAnimationFrame((timestamp) => {
                this.update(timestamp);
            });
        }
    }
    serve() {
        this.shouldServe = false;
        this.serveTime = this.time;
        this.ballVelocity.x = this.genRandom();
        this.ballVelocity.y = this.genRandom();
        this.buildBallPath(this.center);
    }
    genRandom() {
        const range = 100;
        return Math.random() * (range + range + 1) - range;
    }
    reset() {
        this.running = false;
        window.cancelAnimationFrame(this.lastAnimationFrame);
        this.resetPaddles();
        this.resetBall();
        this.resetScores();
    }
    resetPath(path) {
        path.setAttribute('d', this.center.asAbsolute());
    }
    resetBall() {
        this.resetPath(this.elements.ballPath);
        this.resetPath(this.elements.collisionPath);
    }
    resetPaddles() {
        translateToPosition(this.elements.playerPaddle, this.playerStartingPosition);
        this.playerPosition = this.playerStartingPosition.clone();
        translateToPosition(this.elements.aiPaddle, this.aiStartingPosition);
        this.aiPosition = this.aiStartingPosition.clone();
    }
    resetScores() {
        this.playerScore = 0;
        this.aiScore = 0;
        this.elements.playerScoreElement.innerHTML = '0';
        this.elements.aiScoreElement.innerHTML = '0';
    }
    update(timestamp) {
        this.lastTime = this.time;
        this.time = timestamp;
        if (this.shouldServe)
            this.serve();
        this.processAScore();
        this.processHit();
        this.updatePlayer();
        this.updateAI();
        if (this.running)
            this.lastAnimationFrame = window.requestAnimationFrame((timestamp) => {
                this.update(timestamp);
            });
    }
    isColliding(paddle) {
        return paddle.y + this.paddleHeight > this.collisionPoint.y &&
            paddle.y < this.collisionPoint.y;
    }
    processAScore() {
        if (this.timeSinceServe > this.scoreDur) {
            if (this.ballVelocity.x > 0) {
                this.processScore(this.elements.playerScoreElement);
                return;
            }
            else {
                this.processScore(this.elements.aiScoreElement);
                return;
            }
        }
    }
    processScore(textElement) {
        let score;
        if (textElement == this.elements.playerScoreElement) {
            this.playerScore++;
            score = this.playerScore;
        }
        else {
            this.aiScore++;
            score = this.aiScore;
        }
        textElement.innerHTML = score.toString();
        this.running = false;
        this.resetBall();
        this.resetPaddles();
    }
    processHit() {
        if (this.timeSinceServe > this.collisionDur) {
            if (this.ballVelocity.x > 0) {
                if (this.isColliding(this.aiPosition)) {
                    this.processPaddleHit(false);
                }
            }
            else {
                if (this.isColliding(this.playerPosition)) {
                    this.processPaddleHit(true);
                }
            }
        }
    }
    processPaddleHit(isPlayer) {
        this.ballVelocity.x = -this.ballVelocity.x;
        if (isPlayer)
            this.collisionPoint.x += 0.1;
        else
            this.collisionPoint.x -= 0.1;
        this.buildBallPath(this.collisionPoint);
        this.serveTime = this.time;
    }
    updatePlayer() {
        const dy = this.deltaT * this.paddleVelocity;
        if (this.moveDown)
            this.playerPosition.y = Math.min(this.height - this.paddleHeight, this.playerPosition.y + dy);
        else if (this.moveUp)
            this.playerPosition.y = Math.max(this.playerPosition.y - dy, 0);
        if (this.moveDown || this.moveUp) {
            console.log('did the move');
            translateToPosition(this.elements.playerPaddle, this.playerPosition);
            this.moveDown = false;
            this.moveUp = false;
        }
    }
    updateAI() {
        let move = false;
        const dy = this.deltaT * this.paddleVelocity;
        if (this.aiPosition.y + this.paddleHeight / 2 > this.collisionPoint.y) {
            move = true;
            this.aiPosition.y = Math.max(this.aiPosition.y - dy, 0);
        }
        else if (this.aiPosition.y < this.collisionPoint.y) {
            move = true;
            this.aiPosition.y = Math.min(this.height - this.paddleHeight, this.aiPosition.y + dy);
        }
        if (move) {
            translateToPosition(this.elements.aiPaddle, this.aiPosition);
        }
    }
    buildBallPath(startingPosition) {
        const dir = this.ballVelocity.mul(2000);
        const path = new Line(startingPosition, startingPosition.add(dir));
        const points = [];
        while (true) {
            const maybeIntersect = this.findNextCollision(path);
            if (maybeIntersect !== null) {
                const [point, isEnd] = maybeIntersect;
                this.adjustCollision(point, isEnd);
                points.push(point);
                if (isEnd) {
                    for (const line of this.paddleBounds) {
                        const maybeIntersect = lineLineIntersect(path, line);
                        if (maybeIntersect !== null)
                            this.collisionPoint = maybeIntersect;
                    }
                    ;
                    break;
                }
                dir.y = -dir.y;
                path.p1 = point;
                path.p2 = point.add(dir);
            }
            else
                break;
        }
        this.ballVelocity = dir.div(2000);
        const directions = this.getPathCommands(startingPosition, points);
        this.elements.ballPath.setAttribute('d', directions);
        const ballSpeed = this.ballVelocity.magnitude();
        this.scoreDur = this.elements.ballPath.getTotalLength() / ballSpeed;
        this.elements.ballAnimation.setAttribute('dur', this.scoreDur.toString());
        this.elements.ballAnimation.beginElement();
        points.pop();
        points.push(this.collisionPoint);
        const collisionPath = this.getPathCommands(startingPosition, points);
        this.elements.collisionPath.setAttribute('d', collisionPath);
        this.collisionDur = this.elements.collisionPath.getTotalLength() / ballSpeed;
    }
    getPathCommands(start, points) {
        let directions = start.asAbsolute();
        for (const point of points) {
            directions = directions.concat(point.asLine());
        }
        return directions;
    }
    adjustCollision(point, isEnd) {
        if (isEnd) {
            if (point.x > 20)
                point.x += 0.01;
            else
                point.x -= 0.01;
        }
        else {
            if (point.y > 10)
                point.y -= 0.01;
            else
                point.y += 0.01;
        }
    }
    findNextCollision(path) {
        for (const [line, isEnd] of this.bounds) {
            const maybeIntersect = lineLineIntersect(path, line);
            if (maybeIntersect !== null)
                return [maybeIntersect, isEnd];
        }
        return null;
    }
    handleKeyboard(event) {
        const key = event.key;
        if (this.running) {
            if (key === ',')
                this.moveUp = true;
            else if (key === '.')
                this.moveDown = true;
        }
        if (key === ' ')
            this.start();
        else if (key === 'n')
            this.reset();
    }
}
function translateToPosition(element, position) {
    translateTo(element, position.x, position.y);
}
function translateTo(element, x, y) {
    element.setAttribute('transform', `translate(${x}, ${y})`);
}
function lineLineIntersect(l1, l2) {
    const p = l1.p1;
    const q = l2.p1;
    const r = l1.p2.sub(p);
    const s = l2.p2.sub(q);
    const r_cross_s = r.cross(s);
    const q_minus_p = q.sub(p);
    if (r_cross_s === 0) {
        return null;
    }
    else {
        const t = q_minus_p.cross(s.div(r_cross_s));
        const u = q_minus_p.cross(r.div(r_cross_s));
        if (0 <= t && t <= 1 && 0 <= u && u <= 1) {
            if (t === 0)
                return q.add(s.mul(u));
            else
                return p.add(r.mul(t));
        }
        else
            return null;
    }
}
//# sourceMappingURL=library.js.map