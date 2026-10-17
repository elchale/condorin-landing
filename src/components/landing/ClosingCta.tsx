import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import river from "../../../public/img/rio.jpg";

export function ClosingCta() {
  return (
    <section className="px-4 pb-14 sm:px-6 lg:pb-20">
      <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl bg-tinta px-6 py-12 text-center text-white sm:py-16">
        <Image src={river} alt="" fill sizes="100vw" className="-z-10 object-cover opacity-30" />
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Vigila la Amazonía desde tu celular</h2>
        <p className="mx-auto mt-3 max-w-lg text-lg text-white/80">Entra con tu número y elige la zona que quieres vigilar.</p>
        <ButtonLink href="#entrar" className="mt-7">
          Entrar a Condorin <Icon name="arrow" className="size-5" />
        </ButtonLink>
      </div>
    </section>
  );
}
