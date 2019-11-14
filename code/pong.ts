class Vec2 {
    constructor(public x: number, public y: number) {}
    public clone(): Vec2 {
        return new Vec2(this.x, this.y);
    }
    public add(other: Vec2): Vec2 {
        return new Vec2(this.x + other.x, this.y + other.y);
    }
    public sub(other: Vec2): Vec2 {
        return new Vec2(this.x - other.x, this.y - other.y);
    }
    public mul(s: number): Vec2 {
        return new Vec2(this.x * s, this.y * s);
    }
    public div(s: number): Vec2 {
        return new Vec2(this.x / s, this.y / s);
    }
    public cross(other: Vec2): number {
        return this.x * other.y - this.y * other.x;
    }
    public magnitude2(): number {
        return this.x * this.x + this.y * this.y;
    }
    public magnitude(): number {
        return Math.sqrt(this.magnitude2());
    }

    static numberAsString(n: number): string {
        if (n != Math.floor(n)) {
            n.toFixed(2);
        }
        return n.toString();
    }
    public asString(): string {
        return `${Vec2.numberAsString(this.x)},${Vec2.numberAsString(this.y)} `;
    }
    public asAbsolute(): string {
        return `M${this.asString()}`;
    }
    public asLine(): string {
        return `L${this.asString()}`;
    }
}
class Line {
    constructor(public p1: Vec2, public p2: Vec2) {}
}
class PongElements {
    public playerPaddle: SVGRectElement;
    public aiPaddle: SVGRectElement;

    public playerScoreElement: SVGTextElement;
    public aiScoreElement: SVGTextElement;

    public ball: SVGCircleElement;
    public ballAnimation: SVGAnimateMotionElement;
    public ballPath: SVGPathElement;
    public collisionPath: SVGPathElement;

    public resetButton: HTMLButtonElement;
    public serveButton: HTMLButtonElement;

    constructor(svgContent: Document) {
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
    private elements: PongElements;
    readonly width = 512;
    readonly height = 256;
    readonly center = new Vec2(this.width / 2, this.height / 2);
    readonly paddleWidth = 2
    readonly paddleHeight = 28;
    readonly ballRadius = 3;
    readonly paddleVelocity = 60;
    readonly playerStartingPosition = new Vec2(0, this.center.y - this.paddleHeight/2);
    readonly aiStartingPosition = new Vec2(this.width - this.paddleWidth, this.center.y - this.paddleHeight/2);

    readonly corners: Array<Vec2> = [
        new Vec2(-this.ballRadius, this.ballRadius),
        new Vec2(this.width+this.ballRadius, this.ballRadius),
        new Vec2(this.width+this.ballRadius, this.height-this.ballRadius),
        new Vec2(-this.ballRadius, this.height-this.ballRadius)
    ];
    readonly bounds: Array<[Line, boolean]> = [
        [new Line(this.corners[0], this.corners[1]), false],
        [new Line(this.corners[0], this.corners[3]), true],
        [new Line(this.corners[3], this.corners[2]), false],
        [new Line(this.corners[1], this.corners[2]), true]
    ];
    readonly paddleBounds: Array<Line> = [
        this.bounds[0][0],
        new Line(
            new Vec2(this.paddleWidth + this.ballRadius, 0),
            new Vec2(this.paddleWidth + this.ballRadius, this.height)),
        this.bounds[2][0],
        new Line(
            new Vec2(this.width - this.paddleWidth - this.ballRadius, 0),
            new Vec2(this.width - this.paddleWidth - this.ballRadius, this.height))
    ];

    private lastAnimationFrame = 0;

    private playerPosition = this.playerStartingPosition.clone();
    private aiPosition = this.aiStartingPosition.clone();

    private ballVelocity = new Vec2(0, 0);

    private running = false;
    private shouldServe = false;

    private time = 0;
    private lastTime = 0;
    private serveTime = 0;

    private playerScore = 0;
    private aiScore = 0;

    private scoreDur = 0;
    private collisionDur = 0;
    private collisionPoint = new Vec2(0, 128);

    private moveUp = false;
    private moveDown = false;

    constructor(svgContent: Document) {
        this.elements = new PongElements(svgContent);
        this.elements.resetButton.addEventListener('click', () => { this.reset(); });
        this.elements.serveButton.addEventListener('click', () => { this.start(); });
        document.addEventListener('keydown', (event) => { this.handleKeyboard(event); });
    }

    get deltaT(): number { return (this.time - this.lastTime) / 1000; }
    get timeSinceServe(): number { return (this.time - this.serveTime) / 1000; }

    public start() {
        if (!this.running) {
            this.running = true;
            this.shouldServe = true;
            this.lastAnimationFrame = window.requestAnimationFrame((timestamp) => {
                this.update(timestamp);
            });
        }
    }
    private serve() {
        this.shouldServe = false;
        this.serveTime = this.time;
        this.ballVelocity.x = this.genRandom();
        this.ballVelocity.y = this.genRandom();
        this.buildBallPath(this.center);
    }
    private genRandom() {
        const range = 100;
        return Math.random() * (range + range + 1) - range;
    }
    public reset() {
        this.running = false;
        window.cancelAnimationFrame(this.lastAnimationFrame);
        
        this.resetPaddles();
        this.resetBall();
        this.resetScores();
    }
    private resetPath(path: SVGPathElement) {
        path.setAttribute('d', this.center.asAbsolute());
    }
    private resetBall() {
        this.resetPath(this.elements.ballPath);
        this.resetPath(this.elements.collisionPath);
    }
    private resetPaddles() {
        translateToPosition(this.elements.playerPaddle, this.playerStartingPosition);
        this.playerPosition = this.playerStartingPosition.clone();
        translateToPosition(this.elements.aiPaddle, this.aiStartingPosition);
        this.aiPosition = this.aiStartingPosition.clone();
    }
    private resetScores() {
        this.playerScore = 0;
        this.aiScore = 0;
        this.elements.playerScoreElement.innerHTML = '0';
        this.elements.aiScoreElement.innerHTML = '0';
    }
    private update(timestamp: number) {
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
    private isColliding(paddle: Vec2): boolean {
        return paddle.y + this.paddleHeight > this.collisionPoint.y &&
            paddle.y < this.collisionPoint.y;
    }
    private processAScore() {
        if (this.timeSinceServe > this.scoreDur) {
            if (this.ballVelocity.x > 0) { 
                this.processScore(this.elements.playerScoreElement);
                return;
            } else {
                this.processScore(this.elements.aiScoreElement);
                return;
            }
        }
    }
    private processScore(textElement: SVGTextElement) {
        let score;
        if (textElement == this.elements.playerScoreElement) {
            this.playerScore++;
            score = this.playerScore;
        } else {
            this.aiScore++;
            score = this.aiScore;
        }
        textElement.innerHTML = score.toString();
        this.running = false;
        this.resetBall();
        this.resetPaddles();
    }
    private processHit() {
        if (this.timeSinceServe > this.collisionDur) {
            if (this.ballVelocity.x > 0) {
                if (this.isColliding(this.aiPosition)) {
                    this.processPaddleHit(false);
                }
            } else {
                if (this.isColliding(this.playerPosition)) {
                    this.processPaddleHit(true);
                }
            }
        }
    }
    private processPaddleHit(isPlayer: boolean) {
        this.ballVelocity.x = -this.ballVelocity.x;
        if (isPlayer)
            this.collisionPoint.x += 0.1;
        else
            this.collisionPoint.x -= 0.1;

        this.buildBallPath(this.collisionPoint);
        this.serveTime = this.time;
    }
    private updatePlayer() {
        const dy = this.deltaT * this.paddleVelocity;
        if (this.moveDown)
            this.playerPosition.y = Math.min(this.height - this.paddleHeight, this.playerPosition.y + dy);
        else if (this.moveUp)
            this.playerPosition.y = Math.max(this.playerPosition.y - dy, 0);

        if (this.moveDown || this.moveUp) {
            translateToPosition(this.elements.playerPaddle, this.playerPosition);
            this.moveDown = false;
            this.moveUp = false;
        }
    }
    private updateAI() {
        let move = false;
        const dy = this.deltaT * this.paddleVelocity;
        if (this.aiPosition.y + this.paddleHeight / 2 > this.collisionPoint.y) {
            move = true;
            this.aiPosition.y = Math.max(this.aiPosition.y - dy, 0);
        } else if (this.aiPosition.y < this.collisionPoint.y) {
            move = true;
            this.aiPosition.y = Math.min(this.height - this.paddleHeight, this.aiPosition.y + dy);
        }
        if (move) {
            translateToPosition(this.elements.aiPaddle, this.aiPosition);
        }
    }
    private buildBallPath(startingPosition: Vec2) {
        const dir = this.ballVelocity.mul(1000);
        const path = new Line(startingPosition, startingPosition.add(dir));
        const points = [];
        
        while (true) {
            const maybeIntersect = this.findNextCollision(path);
            if (maybeIntersect !== null) {
                const [point, isEnd] = maybeIntersect;
                this.adjustCollision(point, isEnd); // avoid colliding with the same wall again
                points.push(point);
                if (isEnd) {
                    for (const line of this.paddleBounds) {
                        const maybeIntersect = lineLineIntersect(path, line);
                        if (maybeIntersect !== null)
                            this.collisionPoint = maybeIntersect;
                    };
                    break;
                }
                dir.y = -dir.y;
                path.p1 = point;
                path.p2 = point.add(dir);
            } else
                break;
        }
        this.ballVelocity = dir.div(1000);

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
    private getPathCommands(start: Vec2, points: Array<Vec2>): string {
        let directions = start.asAbsolute();
        for (const point of points) {
            directions = directions.concat(point.asLine());
        }
        return directions;
    }
    private adjustCollision(point: Vec2, isEnd: boolean) {
        if (isEnd) {
            if (point.x > 20)
                point.x += 0.01;
            else
                point.x -= 0.01;
        } else {
            if (point.y > 10)
                point.y -= 0.01;
            else
                point.y += 0.01;
        }
    }
    private findNextCollision(path: Line): null | [Vec2, boolean] {
        for (const [line, isEnd] of this.bounds) {
            const maybeIntersect = lineLineIntersect(path, line);
            if (maybeIntersect !== null)
                return [maybeIntersect, isEnd];
        }
        return null;
    }
    private handleKeyboard(event: KeyboardEvent) {
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

function translateToPosition(element: SVGElement, position: Vec2) {
    translateTo(element, position.x, position.y);
}
function translateTo(element: SVGElement, x: number, y: number) {
    element.setAttribute('transform', `translate(${x}, ${y})`);
}

function lineLineIntersect(l1: Line, l2: Line): null | Vec2 {
    const p = l1.p1;
    const r = l1.p2.sub(p);

    const q = l2.p1;
    const s = l2.p2.sub(q);

    const r_cross_s = r.cross(s);
    const q_minus_p = q.sub(p);

    if (r_cross_s === 0) {
        return null;
        // let q_minus_p_cross_r = q_minus_p.cross(r);
        // if (q_minus_p_cross_r === 0)
        //     return null; // collinear
        // else
        //     return null; // parallel
    } else {
        const t = q_minus_p.cross(s.div(r_cross_s));
        const u = q_minus_p.cross(r.div(r_cross_s));
        if (0 <= t && t <= 1 && 0 <= u && u <= 1) {
            if (t === 0)
                return q.add(s.mul(u));
            else
                return p.add(r.mul(t));
        }
        else
            return null; // divergent
    }
}