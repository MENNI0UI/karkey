import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AssetService } from './asset-service'
import fs from 'fs'
import path from 'path'

// Mock fs and path
vi.mock('fs')

describe('AssetService', () => {
    const mockCwd = '/app'

    beforeEach(() => {
        vi.spyOn(process, 'cwd').mockReturnValue(mockCwd)

        // Mock join to simply join with /
        vi.spyOn(path, 'join').mockImplementation((...args) => args.join('/').replace(/\/+/g, '/'))

        // Mock resolve to actually handle '..' to test security check
        vi.spyOn(path, 'resolve').mockImplementation((...args) => {
            // Collapse .. segments
            const combined = args.join('/').replace(/\/+/g, '/')
            const parts = combined.split('/')
            const stack: string[] = []
            for (const part of parts) {
                if (part === '' && stack.length === 0) { stack.push(''); continue; } // Keep leading /
                if (part === '.') continue
                if (part === '..') {
                    if (stack.length > 0 && stack[stack.length - 1] !== '') stack.pop()
                } else {
                    stack.push(part)
                }
            }
            return stack.join('/') || '/'
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should forbid paths escaping uploads directory', () => {
        const resolution = AssetService.resolve(['..', 'config.js'])
        expect(resolution.type).toBe('FORBIDDEN')
    })

    it('should return NOT_FOUND if file does not exist locally and no cloud', () => {
        vi.spyOn(fs, 'existsSync').mockReturnValue(false)
        process.env.STORAGE_BASE_URL = ""

        const resolution = AssetService.resolve(['my-image.jpg'])
        expect(resolution.type).toBe('NOT_FOUND')
    })

    it('should return REDIRECT if file missing locally but STORAGE_BASE_URL is set', () => {
        vi.spyOn(fs, 'existsSync').mockReturnValue(false)
        process.env.STORAGE_BASE_URL = "https://cdn.example.com"

        const resolution = AssetService.resolve(['folder', 'image.jpg'])
        expect(resolution.type).toBe('REDIRECT')
        if (resolution.type === 'REDIRECT') {
            expect(resolution.url).toBe('https://cdn.example.com/folder/image.jpg')
        }
    })

    it('should return FILE if file exists', () => {
        vi.spyOn(fs, 'existsSync').mockReturnValue(true)
        vi.spyOn(fs, 'statSync').mockReturnValue({ size: 1024 } as any)

        const resolution = AssetService.resolve(['image.png'])
        expect(resolution.type).toBe('FILE')
        if (resolution.type === 'FILE') {
            expect(resolution.size).toBe(1024)
            expect(resolution.contentType).toBe('image/png')
        }
    })

    it('should optimize to AVIF if accepted and exists', () => {
        // Mock file structure:
        // original.jpg -> exists
        // original.avif -> exists
        vi.spyOn(fs, 'existsSync').mockImplementation((p) => {
            const str = String(p)
            if (str.endsWith('image.jpg')) return true
            if (str.endsWith('image.avif')) return true
            return false
        })
        vi.spyOn(fs, 'statSync').mockReturnValue({ size: 500 } as any)

        const resolution = AssetService.resolve(['image.jpg'], 'image/avif')

        expect(resolution.type).toBe('FILE')
        if (resolution.type === 'FILE') {
            expect(resolution.filePath).toContain('.avif')
            expect(resolution.contentType).toBe('image/avif')
        }
    })

    it('should optimize to WebP if accepted and exists (and no AVIF)', () => {
        // Mock file structure:
        // original.jpg -> exists
        // original.avif -> does NOT exist
        // original.webp -> exists
        vi.spyOn(fs, 'existsSync').mockImplementation((p) => {
            const str = String(p)
            if (str.endsWith('image.jpg')) return true
            if (str.endsWith('image.avif')) return false
            if (str.endsWith('image.webp')) return true
            return false
        })
        vi.spyOn(fs, 'statSync').mockReturnValue({ size: 600 } as any)

        const resolution = AssetService.resolve(['image.jpg'], 'image/webp, image/avif')

        expect(resolution.type).toBe('FILE')
        if (resolution.type === 'FILE') {
            expect(resolution.filePath).toContain('.webp')
            expect(resolution.contentType).toBe('image/webp')
        }
    })
})
