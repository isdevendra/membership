
import { PageHeader } from "@/components/page-header";
import { ImportExportTool } from "./components/import-export-tool";

export default function ImportExportPage() {
    return (
        <div>
            <PageHeader title="Import & Export" />
            <ImportExportTool />
        </div>
    );
}
