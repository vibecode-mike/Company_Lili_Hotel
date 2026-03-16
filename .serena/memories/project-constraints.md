# lili_hotel Frontend Project Constraints

## Rules (ALWAYS follow every session)
- DO NOT touch nginx configs (/etc/nginx or any nginx-related files)
- DO NOT use prod/staging environments
- ONLY modify files inside /data2/lili_hotel/frontend/
- DO NOT touch unrelated scheduled jobs or background services

## Environment
- Frontend dev server: 192.168.50.123:5173 (Vite)
- nginx proxy: 192.168.50.120 (chimie.star-bit.io → 192.168.50.123:5173)
- Backend: FastAPI on port 8700

## Tech Stack
- React + TypeScript + Tailwind CSS + Vite

## Project Structure
- /data2/lili_hotel/frontend/src/
  - components/ — shared components
  - pages/ — page components
  - contexts/ — React contexts
  - hooks/, utils/, types/, styles/
