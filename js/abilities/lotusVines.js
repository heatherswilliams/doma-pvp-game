// ==================== LOTUS VINES ABILITY ====================
// Cria videiras de gelo que saem do chão, crescem e procuram inimigos

class LotusVinesAbility {
    constructor(scene, physics, particleSystem) {
        this.scene = scene;
        this.physics = physics;
        this.particleSystem = particleSystem;
        this.vines = [];
    }
    
    cast(player) {
        const castPos = player.position.clone();
        
        // Create multiple vines in a circle around the player
        const vineCount = 8;
        
        for (let i = 0; i < vineCount; i++) {
            const angle = (i / vineCount) * Math.PI * 2;
            const vinePos = castPos.clone().add(new THREE.Vector3(
                Math.cos(angle) * 5,
                0.5,
                Math.sin(angle) * 5
            ));
            
            const vine = this.createVine(vinePos, angle);
            this.scene.add(vine);
            
            this.vines.push({
                mesh: vine,
                startPos: vinePos.clone(),
                angle: angle,
                length: 0,
                maxLength: 40,
                growSpeed: 3,
                age: 0,
                maxAge: 6,
                segments: []
            });
        }
    }
    
    createVine(position, angle) {
        const vineGroup = new THREE.Group();
        vineGroup.position.copy(position);
        
        // Initial segment
        const segmentGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 6);
        const segmentMaterial = new THREE.MeshStandardMaterial({
            color: 0x4ecdc4,
            metalness: 0.4,
            roughness: 0.6,
            emissive: 0x00d4ff,
            emissiveIntensity: 0.3
        });
        
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        segment.position.y = 0.5;
        vineGroup.add(segment);
        
        vineGroup.userData.isVine = true;
        
        return vineGroup;
    }
    
    addVineSegment(vine, direction) {
        const segmentGeometry = new THREE.CylinderGeometry(0.25, 0.2, 2, 6);
        const segmentMaterial = new THREE.MeshStandardMaterial({
            color: 0x4ecdc4,
            metalness: 0.4,
            roughness: 0.6,
            emissive: 0x00d4ff,
            emissiveIntensity: 0.3
        });
        
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        
        // Position relative to last segment
        if (vine.mesh.children.length > 0) {
            const lastChild = vine.mesh.children[vine.mesh.children.length - 1];
            segment.position.copy(lastChild.position);
            segment.position.y += 2;
        }
        
        // Add curvature
        segment.rotation.z = (Math.random() - 0.5) * 0.3;
        segment.rotation.x = (Math.random() - 0.5) * 0.3;
        
        vine.mesh.add(segment);
        vine.segments.push(segment);
        
        // Add ice flower at tip
        if (vine.segments.length % 3 === 0) {
            this.addFlowerToVine(vine);
        }
    }
    
    addFlowerToVine(vine) {
        const flowerGeometry = new THREE.IcosahedronGeometry(0.8, 2);
        const flowerMaterial = new THREE.MeshStandardMaterial({
            color: 0x00d4ff,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x00d4ff,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.9
        });
        
        const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
        
        const lastSegment = vine.mesh.children[vine.mesh.children.length - 1];
        if (lastSegment) {
            flower.position.copy(lastSegment.position);
            flower.position.y += 1.5;
        }
        
        flower.scale.setScalar(0.6);
        vine.mesh.add(flower);
    }
    
    update(deltaTime, enemies) {
        for (let i = this.vines.length - 1; i >= 0; i--) {
            const vine = this.vines[i];
            
            vine.age += deltaTime;
            const progress = vine.age / vine.maxAge;
            
            // Grow vine
            if (vine.length < vine.maxLength) {
                vine.length += vine.growSpeed * deltaTime;
                
                // Add new segments
                if (vine.length > vine.segments.length * 2 - 1) {
                    const direction = new THREE.Vector3(
                        Math.cos(vine.angle),
                        0.5 + Math.sin(vine.age * 2) * 0.3,
                        Math.sin(vine.angle)
                    );
                    
                    this.addVineSegment(vine, direction);
                }
            }
            
            // Find and damage nearby enemies
            enemies.forEach(enemy => {
                vine.mesh.children.forEach(segment => {
                    if (segment.geometry && segment.geometry.type === 'CylinderGeometry') {
                        const dist = segment.getWorldPosition(new THREE.Vector3()).distanceTo(enemy.position);
                        if (dist < 3) {
                            enemy.takeDamage(3);
                            this.particleSystem.createExplosion(segment.getWorldPosition(new THREE.Vector3()), 0x4ecdc4, 10, 1);
                        }
                    }
                });
            });
            
            // Fade out and retract
            if (vine.age > vine.maxAge) {
                this.scene.remove(vine.mesh);
                this.vines.splice(i, 1);
            } else if (progress > 0.7) {
                // Retract animation
                vine.mesh.traverse(child => {
                    if (child.material && child.material.opacity !== undefined) {
                        child.material.opacity *= 0.7;
                    }
                });
            }
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LotusVinesAbility;
}
