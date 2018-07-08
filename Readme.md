# A-Frame Arcade Controls Component

Keyboard controls for walking, jumping and colliding on all meshes on scene.

## Demo

https://aframe-arcade-controls-demo.glitch.me/

<!-- Remix Button -->
<a href="https://glitch.com/edit/#!/remix/aframe-arcade-controls-denemo">
  <img src="https://cdn.glitch.com/2bdfb3f8-05ef-4035-a06e-2043962a3a13%2Fremix%402x.png?1513093958726" alt="remix button" aria-label="remix" height="33">
</a>

## Usage

---
    <script src="//cdn.rawgit.com/donmccurdy/aframe-extras/v4.1.1/dist/aframe-extras.min.js"></script>
    <script src="https://unpkg.com/@tlaukkan/aframe-arcade-controls-component@0.0.2/dist/index.js"></script>
    
    ...
    
    <a-entity id="player" position="0 2 0" arcade-controls="jumpStartSpeed: 5;">
        <a-entity camera look-controls></a-entity><a-entity class="right-controller"></a-entity><a-entity class="left-controller" rotation="0 45 0"></a-entity>
    </a-entity>
---

## Develop

npm run start:dev

## Publish package

### First publish

---
    npm publish --access public
---

### Update

---
    npm run dist
    npm version patch
    npm publish
---