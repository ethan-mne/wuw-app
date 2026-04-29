import Image from 'next/image';

export function MdxImages({
  firstImage,
  secondImage,
  thirdImage,
}: {
  firstImage: string;
  secondImage: string;
  thirdImage?: string;
}) {
  return (
    <div className='flex flex-col my-10 lg:flex-row lg:justify-center gap-[5px] w-full'>
      {[firstImage, secondImage, thirdImage]
        .filter(Boolean)
        .map((image, index) => (
          <div key={index} className='flex-1 '>
            <Image
              src={`/blogImages/${image}`}
              alt=''
              height={0}
              width={0}
              sizes='100VW'
              className='w-full h-full object-contain object-center'
            />
          </div>
        ))}
    </div>
  );
}

export function Heading({
  preGreen,
  green,
  postGreen,
}: {
  preGreen?: string;
  green?: string;
  postGreen?: string;
}) {
  return (
    <h1 className='text-[40px] text-black leading-[50px] my-5 font-bold px-4'>
      {preGreen?.toUpperCase()}{' '}
      <span className='text-[#00D273]'>{green?.toUpperCase()}</span>{' '}
      {postGreen?.toUpperCase()}
    </h1>
  );
}

export function SingleImage({
  image,
  contain = false,
}: {
  image: string;
  contain?: boolean;
}) {
  return (
    <div
      className={`flex-1 my-10 ${contain ? '!h-full' : '!h-[400px]'} lg:h-[550px] w-full`}
    >
      <Image
        src={`/blogImages/${image}`}
        alt=''
        height={0}
        width={0}
        sizes='100VW'
        className={`w-full h-full ${contain ? '!object-contain' : '!object-cover'} object-center`}
      />
    </div>
  );
}

export function Text({
  preBlack,
  black,
  postBlack,
  color = 'gray',
  isBold = false,
  size,
}: {
  preBlack?: string;
  black?: string;
  postBlack?: string;
  color?: 'gray' | 'green';
  isBold?: boolean;
  size?: 'small' | 'medium' | 'large';
}) {
  return (
    <p
      className={`text-[18px] ${!preBlack && !postBlack && '!my-7'} font-medium px-4 ${size === 'medium' && '!text-[22px]'} ${isBold && '!font-semibold !text-[24]'} ${color === 'gray' ? 'text-[#898989] my-2' : 'text-[#00D273] my-1 !font-bold'}  leading-8`}
    >
      {preBlack} <b className='text-black'>{black}</b> {postBlack}
    </p>
  );
}

export function NormalText({ text }: { text: string }) {
  return (
    <p className='text-[20px] px-4 text-black my-8 font-semibold leading-8'>
      {text}
    </p>
  );
}
