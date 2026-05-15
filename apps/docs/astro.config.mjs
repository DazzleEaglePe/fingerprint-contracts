// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'DecData — Docs',
			defaultLocale: 'root',
			locales: {
				root: { label: 'Español', lang: 'es' },
			},
			sidebar: [
				{
					label: 'Inicio',
					items: [
						{ label: 'Introducción', link: '/' },
					],
				},
				{
					label: 'Manual de Usuario',
					items: [
						{ label: 'Instalación y Despliegue', link: '/manual/instalacion/' },
						{ label: 'Guía de Uso', link: '/manual/uso/' },
					],
				},
				{
					label: 'Arquitectura del Sistema',
					items: [
						{ label: 'Arquitectura General', link: '/arquitectura/general/' },
						{ label: 'Motor Biométrico', link: '/arquitectura/biometrico/' },
						{ label: 'API REST (FastAPI)', link: '/arquitectura/api/' },
						{ label: 'Frontend (Next.js)', link: '/arquitectura/frontend/' },
					],
				},
				{
					label: 'Evaluación Biométrica',
					items: [
						{ label: 'Resultados FAR / FRR', link: '/evaluacion/far-frr/' },
						{ label: 'Dataset SOCOFing', link: '/evaluacion/dataset/' },
					],
				},
			],
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
