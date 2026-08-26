import { expect, test } from "@playwright/test";

test("admin can create a company, generate a mock site and manage sales", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.goto("/admin/companies/new");
  await page.getByLabel("Naziv firme (opciono)").fill("Mlekara Jović");
  await page.getByRole("button", { name: "Dalje" }).click();
  await page.getByLabel("Javni URL-ovi (do 5, svaki u novom redu)").fill("https://mlekara.example");
  await page.getByRole("button", { name: "Dalje" }).click();
  await page.getByText("Potvrđujem da smem").click();
  await page.getByRole("button", { name: "Kreiraj firmu" }).click();
  await page.waitForURL("**/admin/companies/**");
  await expect(page.getByText("Na čekanju")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Sajt je spreman")).toBeVisible({ timeout: 60_000 });
  await page.getByRole("tab", { name: "Preview" }).click();
  await expect(page.locator("iframe[title='Pregled sajta']")).toBeVisible();
  await page.getByRole("tab", { name: "Prodaja" }).click();
  await page.getByRole("button", { name: "Generiši mejl" }).click();
  await expect(page.getByRole("textbox").first()).toHaveValue(/Pripremili smo predlog sajta/);
});
