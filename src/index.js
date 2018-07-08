/* global AFRAME, THREE */

if (typeof AFRAME === 'undefined') {
    throw new Error('AFRAME not available.');
}

if (typeof THREE === 'undefined') {
    throw new Error('THREE not available.');
}

class ArcadeController {

    constructor(el, data) {
        this.el = el;
        this.data = data;

        // Configuration
        this.movementSpeed = this.data.movementSpeed;
        this.height = this.data.height;
        this.width = this.data.width;
        this.jumpStartSpeed = this.data.jumpStartSpeed;

        this.forwardKey = this.data.forwardKey;
        this.backwardKey = this.data.backwardKey;
        this.leftKey = this.data.leftKey;
        this.rightKey = this.data.rightKey;
        this.jumpKey = this.data.jumpKey;

        // Utility objects
        this.collediableCrawler = new CollidableCrawler(el.sceneEl.object3D);
        this.raycaster = new THREE.Raycaster();

        // Constants
        this.yAxisPositive = new THREE.Vector3(0, 1, 0);
        this.yAxisNegative = new THREE.Vector3(0, -1, 0);
        this.xzPlane = new THREE.Plane(this.yAxisPositive);

        // State booleans
        this.jumping = false;
        this.airborne = false;

        // State variables
        this.time = 0;
        this.yVelocity = 0;
        this.pressed = new Map(); // Pressed keys

        // Reused vector variables.
        this.cameraDirection = new THREE.Vector3(0, 0, 0);
        this.xzDirection = new THREE.Vector3(0, 0, 0);
        this.xzDeltaDirection = new THREE.Vector3(0, 0, 0);
        this.xzDeltaOppositeDirection = new THREE.Vector3(0, 0, 0);
    }

    onKeyDown(key) {
        this.pressed.set(key, this.time)
    }

    onKeyUp(key) {
        if (this.pressed.has(key)) {
            this.pressed.delete(key)
        }
    }

    onTick(time, timeDelta) {
        this.collediableCrawler.crawl();

        this.time = time;

        let collidables = this.collediableCrawler.collideables();
        this.updateY(timeDelta, collidables);
        this.updateXZ(timeDelta, collidables);
    }

    updateXZ(timeDelta, collidables) {
        let position = this.el.object3D.position;

        let forward = this.pressed.has(this.forwardKey);
        let backward = this.pressed.has(this.backwardKey);
        let left = this.pressed.has(this.leftKey);
        let right = this.pressed.has(this.rightKey);
        if (forward || backward || left || right) {
            let delta = this.movementSpeed * timeDelta / 1000.0;
            this.computeXZDirectionFromCamera();
            this.xzDeltaDirection.copy(this.xzDirection);
            this.xzDeltaOppositeDirection.copy(this.xzDirection);
            this.xzDeltaOppositeDirection.multiplyScalar(-1);
            if (forward) {
                if (!this.testCollision(this.xzDeltaDirection, collidables)) {
                    position.x += this.xzDeltaDirection.x * delta;
                    position.z += this.xzDeltaDirection.z * delta;
                }
            }
            if (backward) {
                if (!this.testCollision(this.xzDeltaOppositeDirection, collidables)) {
                    position.x += this.xzDeltaOppositeDirection.x * delta;
                    position.z += this.xzDeltaOppositeDirection.z * delta;
                }
            }
            if (left || right) {
                this.xzDeltaDirection.cross(this.yAxisPositive);
                this.xzDeltaOppositeDirection.cross(this.yAxisPositive);
                if (right) {
                    if (!this.testCollision(this.xzDeltaDirection, collidables)) {
                        position.x += this.xzDeltaDirection.x * delta;
                        position.z += this.xzDeltaDirection.z * delta;
                    }
                }
                if (left) {
                    if (!this.testCollision(this.xzDeltaOppositeDirection, collidables)) {
                        position.x += this.xzDeltaOppositeDirection.x * delta;
                        position.z += this.xzDeltaOppositeDirection.z * delta;
                    }
                }
            }
        }
    }

    updateY(timeDelta, collidables) {
        let position = this.el.object3D.position;

        var distanceToNearestBelow = this.findDistanceToNearest(this.yAxisNegative, collidables);

        if (this.pressed.has(this.jumpKey) && !this.jumping && !this.airborne) {
            this.jumping = true;
            this.yVelocity = this.jumpStartSpeed
        }

        let freeDropDelta = this.yVelocity * timeDelta / 1000.0;
        let delta;

        if (distanceToNearestBelow && !this.jumping) {
            let distanceFromBottom = distanceToNearestBelow - this.height / 2;
            if (Math.abs(freeDropDelta) > Math.abs(distanceFromBottom) || Math.abs(distanceFromBottom) < 0.05) {
                delta = -distanceFromBottom
                this.airborne = false
            } else {
                delta = freeDropDelta
                this.airborne = true
            }
        } else {
            delta = freeDropDelta
            this.airborne = true
        }

        if (this.airborne) {
            this.yVelocity -= 9.81 * timeDelta / 1000.0;
        } else {
            this.yVelocity = 0;
        }

        if (this.yVelocity < 0) {
            this.jumping = false;
        }

        position.y += delta;
    }

    computeXZDirectionFromCamera() {
        document.querySelector('[camera]').object3D.getWorldDirection(this.cameraDirection);
        this.cameraDirection.multiplyScalar(-1);
        this.xzPlane.projectPoint(this.cameraDirection, this.xzDirection);
        this.xzDirection.normalize();
    }

    findDistanceToNearest(rayDirection, objects) {
        this.raycaster.near = 0;
        this.raycaster.far = this.height;
        this.raycaster.set(this.el.object3D.position, rayDirection);
        var intersects = this.raycaster.intersectObjects(objects);
        if (intersects.length > 0) {
            return intersects[0].distance;
        } else {
            return null;
        }
    }

    testCollision(direction, objects) {
        let distanceToNearestAhead = this.findDistanceToNearest(direction, objects);
        let collisionAhead = distanceToNearestAhead && distanceToNearestAhead < this.width / 2;
        return collisionAhead;
    }

}

class CollidableCrawler {
    constructor(root) {
        this.root = root;
        this.queuedChildren = [];
        this.queuedChildren.push(this.root.children);
        this.queuedChildrenIndex = 0;
        this.children = [];
        this.childrenIndex = 0;
        this.collidablesFinal = [];
        this.collideablesTemporary = [];
        this.initialCrawlDone = false;
    }

    start() {
        this.crawl()
    }

    collideables() {
        return this.collidablesFinal;
    }

    fullCrawl() {
        while (!this.crawl()) ;
    }

    crawl() {
        if (!this.initialCrawlDone) {
            this.initialCrawlDone = true;
            this.fullCrawl();
            return;
        }
        if (this.children.length > this.childrenIndex) {
            const current = this.children[this.childrenIndex];
            this.childrenIndex++;
            this.queuedChildren.push(current.children);
            if (current.type === 'Mesh') {
                this.collideablesTemporary.push(current)
            }
        } else {
            if (this.queuedChildren.length > this.queuedChildrenIndex) {
                this.children = this.queuedChildren[this.queuedChildrenIndex];
                this.childrenIndex = 0;
                this.queuedChildrenIndex++;
            } else {
                this.queuedChildren = [];
                this.queuedChildren.push(this.root.children);
                this.queuedChildrenIndex = 0;
                this.collidablesFinal = this.collideablesTemporary;
                this.collideablesTemporary = [];
                return true;
            }
        }
        return false;
    }
}

AFRAME.registerComponent('arcade-controls', {
    schema: {
        movementSpeed: {type: 'number', default: 2},
        height: {type: 'number', default: 2},
        width: {type: 'number', default: 0.5},
        jumpStartSpeed: {type: 'number', default: 5.0},
        forwardKey: {type: 'string', default: 'w'},
        backwardKey: {type: 'string', default: 's'},
        leftKey: {type: 'string', default: 'a'},
        rightKey: {type: 'string', default: 'd'},
        jumpKey: {type: 'string', default: ' '}
    },

    init: function () {
        let data = this.data;
        this.controller = new ArcadeController(this.el, this.data);

        window.addEventListener('keydown', (e) => {
            this.controller.onKeyDown(e.key);
        });

        window.addEventListener('keyup', (e) => {
            this.controller.onKeyUp(e.key);
        });

    },
    update: function (oldData) {
        console.log('arcade controls update');
    },
    tick: function (time, timeDelta) {
        this.time = time
        this.controller.onTick(time, timeDelta);
    }
});
