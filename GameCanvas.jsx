import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

const GameCanvas = ({ onScoreUpdate }) => {
  const mountRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    // Настройка сцены
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    
    // Камера
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    
    // Рендерер
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Эффекты постобработки
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, 0.4, 0.85
    );
    composer.addPass(bloomPass);
    
    // Освещение
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Контроллеры
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    // Загрузка 3D моделей
    const loader = new GLTFLoader();
    const platforms = [];
    const coins = [];
    const enemies = [];
    
    // Создание игрового мира
    function createPlatform(x, y, z, width, height, depth) {
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x10b981,
        emissive: 0x064e3b,
        shininess: 100
      });
      const platform = new THREE.Mesh(geometry, material);
      platform.position.set(x, y, z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      scene.add(platform);
      platforms.push(platform);
      return platform;
    }
    
    // Создание игрока
    const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
    const playerMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x7c3aed,
      emissive: 0x4c1d95
    });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 5, 0);
    player.castShadow = true;
    scene.add(player);
    
    // Создание монеток
    function createCoin(x, y, z) {
      const geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0xfbbf24,
        emissive: 0xd97706
      });
      const coin = new THREE.Mesh(geometry, material);
      coin.position.set(x, y, z);
      coin.rotation.x = Math.PI / 2;
      scene.add(coin);
      coins.push({ mesh: coin, collected: false });
      return coin;
    }
    
    // Создание платформ
    for (let i = 0; i < 20; i++) {
      createPlatform(
        Math.random() * 40 - 20,
        Math.random() * 10,
        Math.random() * 40 - 20,
        Math.random() * 5 + 2,
        0.5,
        Math.random() * 5 + 2
      );
    }
    
    // Создание монеток
    for (let i = 0; i < 30; i++) {
      createCoin(
        Math.random() * 40 - 20,
        Math.random() * 15 + 5,
        Math.random() * 40 - 20
      );
    }
    
    // Физика
    const velocity = new THREE.Vector3();
    const gravity = new THREE.Vector3(0, -0.02, 0);
    const keys = {};
    
    // Обработка клавиш
    const handleKeyDown = (e) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') { // Пробел
        velocity.y = 0.3;
      }
    };
    
    const handleKeyUp = (e) => {
      keys[e.key.toLowerCase()] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Игровой цикл
    function animate() {
      requestAnimationFrame(animate);
      
      if (gameStarted) {
        // Движение игрока
        const speed = 0.1;
        if (keys['arrowleft'] || keys['a']) velocity.x = -speed;
        if (keys['arrowright'] || keys['d']) velocity.x = speed;
        if (keys['arrowup'] || keys['w']) velocity.z = -speed;
        if (keys['arrowdown'] || keys['s']) velocity.z = speed;
        
        // Применение гравитации
        velocity.add(gravity);
        
        // Обновление позиции
        player.position.add(velocity);
        
        // Проверка столкновений с платформами
        let onGround = false;
        platforms.forEach(platform => {
          const box1 = new THREE.Box3().setFromObject(player);
          const box2 = new THREE.Box3().setFromObject(platform);
          
          if (box1.intersectsBox(box2)) {
            if (velocity.y < 0 && player.position.y > platform.position.y) {
              player.position.y = platform.position.y + platform.geometry.parameters.height / 2 + 1;
              velocity.y = 0;
              onGround = true;
            }
          }
        });
        
        // Сбор монеток
        coins.forEach((coin, index) => {
          if (!coin.collected) {
            const distance = player.position.distanceTo(coin.mesh.position);
            if (distance < 2) {
              coin.collected = true;
              scene.remove(coin.mesh);
              setScore(prev => prev + 100);
              onScoreUpdate(score + 100);
              
              // Эффект сбора
              for (let i = 0; i < 20; i++) {
                const particleGeometry = new THREE.SphereGeometry(0.1);
                const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
                const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                particle.position.copy(coin.mesh.position);
                
                const velocity = new THREE.Vector3(
                  (Math.random() - 0.5) * 0.5,
                  Math.random() * 0.5,
                  (Math.random() - 0.5) * 0.5
                );
                
                scene.add(particle);
                
                setTimeout(() => {
                  scene.remove(particle);
                }, 1000);
              }
            }
          }
        });
        
        // Затухание скорости
        velocity.multiplyScalar(0.9);
        
        // Анимация монеток
        coins.forEach(coin => {
          if (!coin.collected) {
            coin.mesh.rotation.y += 0.05;
            coin.mesh.position.y += Math.sin(Date.now() * 0.005) * 0.02;
          }
        });
      }
      
      // Обновление контролов
      controls.update();
      
      // Рендеринг
      composer.render();
    }
    
    // Добавление на страницу
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }
    
    // Запуск анимации
    animate();
    
    // Обработка ресайза
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Очистка
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [gameStarted, onScoreUpdate, score]);

  return (
    <div className="relative">
      <div 
        ref={mountRef} 
        className="w-full h-[600px] rounded-xl overflow-hidden border-2 border-purple-500/30"
      />
      
      {/* Интерфейс игры */}
      <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-sm text-gray-400">Счет</div>
            <div className="text-2xl font-bold text-yellow-400">{score}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Жизни</div>
            <div className="text-2xl font-bold text-red-400">
              {'❤️'.repeat(lives)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Кнопки управления */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex gap-4">
          <button
            onClick={() => setGameStarted(!gameStarted)}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              gameStarted 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {gameStarted ? 'Пауза' : 'Начать игру'}
          </button>
          
          <button
            onClick={() => {
              setScore(0);
              setLives(3);
              setGameStarted(true);
            }}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-all"
          >
            Рестарт
          </button>
        </div>
      </div>
      
      {/* Инструкции */}
      {!gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm">
          <div className="text-center p-8 bg-gray-800/90 rounded-2xl max-w-md">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Платформер
            </h2>
            <p className="text-gray-300 mb-6">
              Собирайте золотые монетки, избегайте препятствий и устанавливайте рекорды!
            </p>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">←→</div>
                <span>Движение влево/вправо</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">WS</div>
                <span>Движение вперед/назад</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">␣</div>
                <span>Прыжок</span>
              </div>
            </div>
            <button
              onClick={() => setGameStarted(true)}
              className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-lg hover:opacity-90 transition-all"
            >
              Начать игру
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;