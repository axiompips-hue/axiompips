import { Container } from "@/components/ui/Container";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <section className="py-8 md:py-12">
      <Container>
        {/* Header skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton height={36} width={200} className="mb-2" />
            <Skeleton height={20} width={300} />
          </div>
          <Skeleton height={40} width={120} rounded="lg" />
        </div>

        {/* Main Layout skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats sidebar skeleton */}
          <div className="space-y-4">
            <Skeleton height={200} rounded="xl" />
            <Skeleton height={150} rounded="xl" />
          </div>

          {/* Trades list skeleton */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2 mb-4">
              <Skeleton height={40} width={100} rounded="lg" />
              <Skeleton height={40} width={100} rounded="lg" />
              <Skeleton height={40} width={100} rounded="lg" />
            </div>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}