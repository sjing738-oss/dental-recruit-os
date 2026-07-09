import { BuildingPage } from "@/components/BuildingPage";

export default function OnboardingPage() {
  return (
    <BuildingPage
      title="入职承接"
      desc="Offer 接受后的资料清单、首日安排与 30/60/90 天融入计划"
      phase="P8"
      features={["入职资料清单", "首日安排", "30/60/90 天计划", "试用期观察点"]}
    />
  );
}
