class Vec2 {
    constructor(public x: number, public y: number) {}
    clone(): Vec2 {
        return new Vec2(this.x, this.y);
    }
    add(other: Vec2): Vec2 {
        return new Vec2(this.x + other.x, this.y + other.y);
    }
    sub(other: Vec2): Vec2 {
        return new Vec2(this.x - other.x, this.y - other.y);
    }
    mul(s: number): Vec2 {
        return new Vec2(this.x * s, this.y * s);
    }
    div(s: number): Vec2 {
        return new Vec2(this.x / s, this.y / s);
    }
    cross(other: Vec2): number {
        return this.x * other.y - this.y * other.x;
    }
    magnitude2(): number {
        return this.x * this.x + this.y * this.y;
    }
    magnitude(): number {
        return Math.sqrt(this.magnitude2());
    }

    asString(): string {
        return `${this.x} ${this.y} `;
    }
    asAbsolute(): string {
        return `M${this.asString()}`;
    }
    asLine(): string {
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
        new Line(new Vec2(this.paddleWidth, 0), new Vec2(this.paddleWidth, this.height)),
        this.bounds[2][0],
        new Line(new Vec2(this.width - this.paddleWidth, 0), new Vec2(this.width - this.paddleWidth, this.height))
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
    private collisionPoint = new Vec2(0, 0);

    private moveUp = false;
    private moveDown = false;

    constructor(svgContent: Document) {
        this.elements = new PongElements(svgContent);
        this.elements.resetButton.addEventListener('click', () => { this.reset(); });
        this.elements.serveButton.addEventListener('click', () => { this.start(); });
        document.addEventListener('keydown', (event) => { this.handleKeyboard(event); });
    }

    get deltaT(): number { return this.time - this.lastTime; }
    get timeSinceServe(): number { return (this.time - this.serveTime); }

    public start() {
        if (!this.running) {
            this.running = true;
            this.shouldServe = true;
            this.lastAnimationFrame = window.requestAnimationFrame((timestamp) => {
                this.update(timestamp);
            });
        }
    }
    public reset() {
        this.running = false;
        window.cancelAnimationFrame(this.lastAnimationFrame);
        
        this.resetPaddles();
        this.resetBall();
        this.resetScores();
    }
    private update(timestamp: number) {
        this.lastTime = this.time;
        this.time = timestamp;

        if (this.shouldServe)
            this.serve();

        if (this.timeSinceServe / 1000 > this.collisionDur) {
            if (this.ballVelocity.x < 0) {
                if (this.playerPosition.y + this.paddleHeight > this.collisionPoint.y &&
                    this.playerPosition.y < this.collisionPoint.y)
                {
                    this.reset();
                    return;
                }
            } else {

            }
        }
        if (this.timeSinceServe / 1000 > this.scoreDur)
            if (this.ballVelocity.x > 0)
                this.processScore(true, this.elements.playerScoreElement);
            else
                this.processScore(false, this.elements.aiScoreElement);

        let dy = this.deltaT / 1000 * this.paddleVelocity;
        if (this.moveDown)
            this.playerPosition.y =
                Math.min(this.height - this.paddleHeight, this.playerPosition.y + dy);
        else if (this.moveUp)
            this.playerPosition.y = Math.max(this.playerPosition.y - dy, 0);

        if (this.moveDown || this.moveUp) {
            translateToPosition(this.elements.playerPaddle, this.playerPosition);
            this.moveDown = false;
            this.moveUp = false;
        }

        if (this.running)
            this.lastAnimationFrame = window.requestAnimationFrame((timestamp) => {
                this.update(timestamp);
            });
    }
    private serve() {
        this.shouldServe = false;
        this.serveTime = this.time;
        this.ballVelocity.x = this.genRandom();
        this.ballVelocity.y = this.genRandom();
        this.buildBallPath();
    }
    private genRandom() {
        const range = 60;
        return Math.floor(Math.random() * (range + range + 1) - range);
    }
    private buildBallPath() {
        let dir = this.ballVelocity.mul(600);
        let path = new Line(this.center, this.center.add(dir));
        let points = [];
        while (true) {
            let maybeIntersect = this.findNextCollision(path);
            if (maybeIntersect !== null) {
                let [point, isEnd] = maybeIntersect;

                this.adjustCollision(point, isEnd);
                points.push(point);
                if (isEnd) {
                    for (let line of this.paddleBounds) {
                        let maybeIntersect = lineLineIntersect(path, line);
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
        let directions = this.getPathCommands(this.center, points);

        points.pop();
        points.push(this.collisionPoint);
        let collisionPath = this.getPathCommands(this.center, points);
        this.elements.collisionPath.setAttribute('d', collisionPath);
        let ballSpeed = this.ballVelocity.magnitude();
        this.collisionDur = this.elements.collisionPath.getTotalLength() / ballSpeed;

        this.elements.ballPath.setAttribute('d', directions);
        this.scoreDur = this.elements.ballPath.getTotalLength() / ballSpeed;
        this.elements.ballAnimation.setAttribute('dur', this.scoreDur.toString());
        this.elements.ballAnimation.beginElement();
    }
    private getPathCommands(start: Vec2, points: Array<Vec2>): string {
        let directions = start.asAbsolute();
        for (let point of points) {
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
        for (let [line, isEnd] of this.bounds) {
            let maybeIntersect = lineLineIntersect(path, line);
            if (maybeIntersect !== null)
                return [maybeIntersect, isEnd];
        }
        return null;
    }
    private processScore(isPlayer: boolean, textElement: SVGTextElement) {
        let score;
        if (isPlayer) {
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
    private handleKeyboard(event: KeyboardEvent) {
        let key = event.key;
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
    let p = l1.p1;
    let q = l2.p1;

    let r = l1.p2.sub(p);
    let s = l2.p2.sub(q);

    let r_cross_s = r.cross(s);
    let q_minus_p = q.sub(p);
    // let q_minus_p_cross_r = q_minus_p.cross(r);

    if (r_cross_s === 0) {
        return null;
        // if (q_minus_p_cross_r === 0)
        //     return null; // collinear
        // else
        //     return null; // parallel
    } else {
        let t = q_minus_p.cross(s.div(r_cross_s));
        let u = q_minus_p.cross(r.div(r_cross_s));
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