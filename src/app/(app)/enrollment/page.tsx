import { PageHeader } from "@/components/page-header";
import { EnrollmentForm } from "./components/enrollment-form";

export default function EnrollmentPage() {
  return (
    <div>
      <PageHeader title="New Member Enrollment" />
      <EnrollmentForm />
    </div>
  );
}
