# Eidolon IV

> Death offers an alluring covenant laced with grotesque mockery...  
> Moths entranced by a flame's fatal caress, they mistake the Reaper's gilded embrace for salvation.

![bloomscythe](https://github.com/user-attachments/assets/242617d9-403b-4d6b-b380-9c3c36c3945c)

---

## Table of Contents

1. [Introduction](#introduction)  
2. [Game Mechanics](#game-mechanics)
   - [Orb Charges](#orb-charges)
   - [Health](#health)
   - [Critical Hit Chance](#critical-hit-chance)
   - [Enemies](#enemies)
3. [Controls](#controls)
   - [Movement and Camera](#movement-and-camera)
   - [Combat Controls](#combat-controls)
4. [Custom Models](#custom-models)
   - [Bone Wings](#bone-wings)  
   - [Sword Guard](#sword-guard)  
   - [Shoulder Plates](#shoulder-plates)   
5. [Early Development](#early-development)
   - [v1.0 - Initial Release](#v10---initial-release)  
   - [v0.9 - Orb Charges](#v09---orb-charges)  
   - [v0.8 - Etherbow](#v08---etherbow)  
   - [v0.7 - Starter Corpse](#v07---starter-corpse)  
   - [v0.6 - Sword Smite](#v06---sword-smite)  
   - [v0.5 - Swing Animations](#v05---swing-animations)  
   - [v0.4 - Weapon Swapping](#v04---weapon-swapping)  
   - [v0.3 - Scene Environment](#v03---scene-environment)  
   - [v0.2 - Weapon Models](#v02---weapon-models)  
   - [v0.1 - Baseline](#v01---baseline)
   - [v0.0 - Inception](#v00---inception)

---

## Introduction
In this graveyard of stars, Death grants all a bleak choice:

- Linger in an ossuary for the restless, eternally locked in combat—where ambition and despair intertwine, and where the fallen fuel the ascent of those hungrier to covet hope.  
- Devour the essence of unwitting tributes that challenge your claim—their fading hopes now yours to wield, crystallizing within your form. Weave the harvested bones into the tapestry of your destiny, forging a being from the echoes of those who dared to dream and ascended to scale the jagged peaks anchoring the souls to this stygian ark.

---

## Game Mechanics

### Orb Charges
- All weapons have 8 orb charges, each with an 8 second cooldown. Only the Scythe consumes these orbs with its ‘E’ ability at the beginning of Level 1. Note that abilities that have an orb cost may still possess separate cooldowns. 

### Health
- Each kill grants 1 point of maximum health (the kill counter is the right circle next to the experience bar), which also effectively heals for 1 HP (+1 Current HP /+1 Maximum HP). 
- There is no passive health regeneration; however, the Scythe and Greatsword have option(s) for healing that they may choose to unlock. 

### Critical Hit Chance
- By default is 11%, dealing double damage. 

### Enemies
- When an enemy begins its attack animation, there is a 1-second delay before any damage can be registered, allowing a short window to reposition and evade the attack. ALL attacks outrange enemy attacks, but vary in degree based on weapon choice. 

---

## Controls

| Action             | Input                |
|--------------------|----------------------|
| **Movement**       |   `WASD`               |
| **Camera**         | Right-click (hold)  |
| **Auto-Attack**    | Right-click (hold)   |
| **Zoom**           | Scroll Wheel          |


### Movement and Camera

- A mouse is highly recommended for optimal gameplay.

- Holding the Right-Click WHILE moving with W-A-S-D keys will allow smooth movement with camera control. This will also allow you to quickly switch targets, reposition, and efficiently aim at targets in front of you. 

- Holding the Left-Click will also perform an auto-attack that is the same as the weapon’s ‘Q’ ability, or regular attack swing. All combat ability buttons {Q,E,R,1,2} can be held down as well; they will cast automatically within their cooldown frame.

- The A key to move backwards will come in very handy when you want to evade attacks while also dealing damage to enemies that are encroaching on you. However, **walking backwards will incur a movement speed penalty**. 

- W-A-S-D can be held in combinations such as holding ‘W’ and ‘A’ together to go Northwest, S-D to go Southeast, etc. 

### Combat Controls

- **(‘Q’)**  is the default attack of the weapon that can also be triggered by the Left-Click.
	- Scythe: 4.5 ft range - 0.8 second cooldown - Damage: 23- Medium Arc
	- Sword: 6.0 ft range - 1.00 second cooldown - Damage: 31 - Wide Arc
	- Sabres: 4.0 ft range - 0.6 second cooldown - Damage: 17x2 - Narrow Arc 

- **('E')** is the weapon’s unique ability: 
	- Scythe: ‘Entropic Bolt’ - Orb Cost: 1 - Cooldown: 0.7s - Damage: 53 - single target
	- Sword: ‘Divine Smite’ - Orb Cost: 0 - Cooldown: 4s - Damage: 31+17 (sword) + 41 (smite) - area of effect
		- Note: Smite damage will only trigger if the ability’s sword damage successfully hits a target. 
	- Scythe: ‘Etherbow’ - Orb Cost: 0 - Cooldown: 0.5s - Damage: 13 base, scaling with charge time - in a line
		- Note: Fully charged shots are guaranteed critical strikes. 

- **('R' - '1' - '2')**  hotkeys are for the 3 ability choices that are available for each weapon to unlock at the completion of a level. The designations ‘Active' or ‘Passive’ determine whether or not an ability’s hotkey needs to be pressed to trigger its effect. 

---

## Custom Models

### Bone Wings
![BONEWING CREATION](https://github.com/user-attachments/assets/dde85184-7ff0-4899-b287-e9c7116630c5)

### Shoulder Plates
![SHOULDERPLATE CREATION 1](https://github.com/user-attachments/assets/7ba462a9-649f-41a9-8bdc-835a2b3d56cd)
![SHOULDERPLATE CREATION 2](https://github.com/user-attachments/assets/e680194a-3ae9-4a66-8922-12bb1e2ddab7)

### Sword Guard
![SWORD GUARD MODEL](https://github.com/user-attachments/assets/ddfd1eb6-b9e6-4314-ada7-3815697372be)


--- 

## Early Development

### v1.0 - Initial Release
![1 0](https://github.com/user-attachments/assets/836c0443-cdb9-4aed-82dc-1d6d81a60144)

- Enemy spawning + level-up + experience bar logic

### v0.9 - Orbital Charges
![8orbcharges](https://github.com/user-attachments/assets/90c55e1c-8263-4d38-96b0-38ea42274176)

- Logic for expending orbs to cast abilities. 

### v0.8 - Etherbow
![SabreBow2](https://github.com/user-attachments/assets/4de5e2c6-ce47-4229-9151-49f68e870600)

- Introduced charged bow shot as Sabre's 'E' ability.

### v0.7 - Starter Corpse
![bonewingsribcage](https://github.com/user-attachments/assets/a82fc47a-7fa0-4026-9fc5-9281ae64d43a)

- Initial character model with bone wings + ribcage.

### v0.6 - Sword Smite
![smite2](https://github.com/user-attachments/assets/21244e01-d1bd-45fd-a704-53f1261dcafe)

- Introduced Smite as Sword's 'E' ability.

### v0.5 - Swing Animations
![swing animations](https://github.com/user-attachments/assets/a7cea382-d56e-442f-8ef9-c9d9229f9a38)

- Melee swing animations for Scythe, Sword, and Sabres with hit registration.

### v0.4 - Weapon Swapping
![weapon models+swap](https://github.com/user-attachments/assets/ed580b7c-4e8e-411b-b29e-fe6ae3f4ff36)

- Implemented instant weapon swapping via 1-2-3 hotkeys.

### v0.3 - Scene Environment
![island in space](https://github.com/user-attachments/assets/59274513-1c79-44ea-ab8b-1e81c81812d8)

- Island drifting in space, encased in mountains - basic aesthetic

### v0.2 - Weapon Models
![better scythe](https://github.com/user-attachments/assets/974f8599-24f1-45c0-a624-ba313d6ced2b)

- Sword, Scythe, and Sabres initial model creation. 

### v0.1 - Baseline
![1121 (1)(8)](https://github.com/user-attachments/assets/9247e7c6-6cd0-4a21-8616-d08d82f591cf)

- Initial game logic setup with weapon systems.

### v0.0 - Inception
![0 0](https://github.com/user-attachments/assets/83d421de-dede-4131-82d5-27951e388829)

- Earliest video I could find (11/20/24) with basic movement and camera rotation. Was definitely procrastinating here..
