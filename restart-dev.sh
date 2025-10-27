#!/bin/bash

echo "🛑 Deteniendo servidores en puertos 3000 y 3001..."
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true

echo "⏳ Esperando 2 segundos..."
sleep 2

echo "🚀 Iniciando servidor de desarrollo en puerto 3000..."
npm run dev
