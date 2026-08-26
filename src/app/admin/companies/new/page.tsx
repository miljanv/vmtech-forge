import { CompanyWizard } from "@/components/admin/company-wizard";

export const maxDuration = 300;

export default function NewCompanyPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.2em] text-primary uppercase">Novi klijent</p>
        <h1 className="font-heading mt-2 text-4xl">Dodaj firmu</h1>
      </div>
      <CompanyWizard />
    </div>
  );
}
