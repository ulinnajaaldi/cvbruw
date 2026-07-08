import HomeFeature from '#/features/Home'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: HomeFeature })
