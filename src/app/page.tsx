/* eslint-disable @next/next/no-img-element */
'use client'

import { LiveImageShapeUtil } from '@/components/LiveImageShapeUtil'
import { LiveImageTool, MakeLiveButton } from '@/components/LiveImageTool'
import { LockupLink } from '@/components/LockupLink'
import { LiveImageProvider } from '@/hooks/useLiveImage'
import * as fal from '@fal-ai/serverless-client'
import {
	AssetRecordType,
	DefaultSizeStyle,
	Editor,
	TLUiOverrides,
	Tldraw,
	toolbarItem,
	track,
	useEditor,
} from '@tldraw/tldraw'
import { useEffect, useState, useMemo } from 'react'
import { MultimodalChatPanel } from '@/components/MultimodalChatPanel';

fal.config({
	requestMiddleware: fal.withProxy({
		targetUrl: '/api/fal/proxy',
	}),
})

const uiOverrides: TLUiOverrides = {
	tools: (editor, tools) => {
		tools.liveImage = {
			id: 'live-image',
			icon: 'tool-frame',
			label: 'Frame',
			kbd: 'f',
			readonlyOk: false,
			onSelect: () => {
				editor.setCurrentTool('live-image')
			},
		}
		return tools
	},
	toolbar: (_app, toolbar, { tools }) => {
		const frameIndex = toolbar.findIndex((item) => item.id === 'frame')
		if (frameIndex !== -1) toolbar.splice(frameIndex, 1)
		const highlighterIndex = toolbar.findIndex((item) => item.id === 'highlight')
		if (highlighterIndex !== -1) {
			const highlighterItem = toolbar[highlighterIndex]
			toolbar.splice(highlighterIndex, 1)
			toolbar.splice(3, 0, highlighterItem)
		}
		toolbar.splice(2, 0, toolbarItem(tools.liveImage))
		return toolbar
	},
}

export default function Home() {
	return (
		<main className="flex h-screen">
			<MultimodalChatPanel />
			<div className="flex-grow">
				<Tldraw
					overrides={uiOverrides}
					shapeUtils={[LiveImageShapeUtil]}
					tools={[LiveImageTool]}
					shareZone={<MakeLiveButton />}
					persistenceKey="tldraw-draw-fast"
				/>
			</div>
		</main>
	)
}
