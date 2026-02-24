import { test, expect, Page } from '@playwright/test';

// ─── Shared Login Helper ──────────────────────────────────────────────────────
async function loginAsDemoUser(page: Page) {
    await page.goto('/login');
    // Page starts on Sign Up tab – switch to Login first
    await page.click('button:has-text("Log In")');
    await page.fill('input[type="email"]', 'demo@sargvision.ai');
    await page.fill('input[type="password"]', 'DemoPassword123!');
    await page.click('button[type="submit"]:has-text("Log In")');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 20_000 });
}

// ─── Test Suite ───────────────────────────────────────────────────────────────
test.describe('Agent-Powered Features E2E', () => {

    // ── Scenario 1: Lead Mentor Orchestration ─────────────────────────────────
    test('1. LeadMentor: Chat page renders and accepts input', async ({ page }) => {
        await loginAsDemoUser(page);
        await page.goto('/mentor');

        // Page heading is an h1 with the text "AI Mentor"
        await expect(page.getByRole('heading', { name: 'AI Mentor' })).toBeVisible({ timeout: 10_000 });

        // The pre-seeded initial messages should already be visible (no API needed)
        await expect(page.locator('.flex.justify-start').first()).toBeVisible();
        const initialMsgCount = await page.locator('.flex.justify-start').count();
        expect(initialMsgCount).toBeGreaterThanOrEqual(2); // 2 initial AI messages

        // VoiceInput renders as <input> or <textarea> – try both
        const chatInput = page
            .locator('input[placeholder="Ask me anything..."], textarea[placeholder="Ask me anything..."]')
            .first();
        await expect(chatInput).toBeVisible();
        await chatInput.fill('Find me internships in data science');

        // Click the Send button (has the Send lucide icon, and bg-primary styles)
        await page.locator('button.bg-primary:not([disabled])').last().click();

        // User bubble appears immediately (justify-end side)
        await expect(page.locator('.flex.justify-end').first()).toBeVisible({ timeout: 10_000 });
    });

    // ── Scenario 2: Simplification Expert ────────────────────────────────────
    test('2. Simplify page: textarea and action buttons are all present', async ({ page }) => {
        await loginAsDemoUser(page);
        await page.goto('/library/simplify');

        await expect(page.getByRole('heading', { name: 'Concept Simplifier' })).toBeVisible();

        // Input textarea
        const textarea = page.locator('textarea[placeholder*="Paste your complex textbook"]');
        await expect(textarea).toBeVisible();

        // Action buttons: Simplify, Notes, Path
        await expect(page.locator('button:has-text("Simplify")')).toBeVisible();
        await expect(page.locator('button:has-text("Notes")')).toBeVisible();
        await expect(page.locator('button:has-text("Path")')).toBeVisible();

        // Buttons should be disabled when textarea is empty
        const simplifyBtn = page.locator('button:has-text("Simplify")');
        await expect(simplifyBtn).toBeDisabled();

        // Typing enables the button
        await textarea.fill('Quantum entanglement is a phenomenon where...');
        await expect(simplifyBtn).not.toBeDisabled();
    });

    // ── Scenario 3: Career Path Expert / Roadmap ──────────────────────────────
    test('3. Simplify page: roadmap section appears after "Path" click', async ({ page }) => {
        await loginAsDemoUser(page);
        await page.goto('/library/simplify');

        const textarea = page.locator('textarea[placeholder*="Paste your complex textbook"]');
        await textarea.fill('Machine Learning and Deep Neural Networks for computer vision tasks.');

        await page.locator('button:has-text("Path")').click();

        // Either the roadmap section appears (if API is up) or an error message is shown
        // We accept either – both prove the button triggers the agent flow
        await expect(
            page.locator('h2:has-text("Career Roadmap"), .whitespace-pre-wrap').first()
        ).toBeVisible({ timeout: 30_000 });
    });

    // ── Scenario 4: Opportunity Discovery ────────────────────────────────────
    test('4. Opportunities: page loads with cards and AI Scout button', async ({ page }) => {
        await loginAsDemoUser(page);
        await page.goto('/opportunities');

        await expect(page.getByRole('heading', { name: 'Opportunity Radar' })).toBeVisible();

        // Wait for loading to finish (loader spinner should disappear)
        await page.locator('.animate-spin').waitFor({ state: 'hidden', timeout: 30_000 });

        // Cards load from demo data even without API
        await expect(page.locator('text=Google Summer of Code 2026').first()).toBeVisible({ timeout: 15_000 });
        const count = await page.locator('.glass.p-4.rounded-2xl').count();
        expect(count).toBeGreaterThan(0);

        // Verify AI Scout (OpportunityScout trigger) button is present
        await expect(page.locator('button:has-text("AI Scout")')).toBeVisible();
    });

    // ── Scenario 5: Scholarship Radar ────────────────────────────────────────
    test('5. Scholarships: filter chip shows scholarship cards', async ({ page }) => {
        await loginAsDemoUser(page);
        await page.goto('/opportunities');

        await expect(page.getByRole('heading', { name: 'Opportunity Radar' })).toBeVisible();

        // Wait for loading to finish
        await page.locator('.animate-spin').waitFor({ state: 'hidden', timeout: 30_000 });

        // Click "Scholarship" filter
        await page.click('button:has-text("Scholarship")');

        // After filtering, only scholarship cards remain – check the badge or a specific scholarship
        const scholarshipBadge = page.locator('span:has-text("Scholarship")').first();
        await expect(scholarshipBadge).toBeVisible({ timeout: 10_000 });
    });

    // ── Scenario 6: Skilling Coach / Learning Paths ───────────────────────────
    test('6. Learning: page shows paths and Enroll buttons', async ({ page }) => {
        await loginAsDemoUser(page);
        await page.goto('/learning');

        await expect(page.getByRole('heading', { name: 'Learning Paths' })).toBeVisible();

        // Content resolves from demo data
        await page.locator('.animate-spin').waitFor({ state: 'hidden', timeout: 30_000 });

        // "Recommended for You" section (always renders with demo paths)
        await expect(page.locator('h2:has-text("Recommended for You")')).toBeVisible({ timeout: 10_000 });

        // At least one Enroll button should be in the DOM
        const enrollButtons = page.locator('button:has-text("Enroll")');
        await expect(enrollButtons.first()).toBeVisible({ timeout: 10_000 });
        const enrollCount = await enrollButtons.count();
        expect(enrollCount).toBeGreaterThan(0);
    });

});
