export default function (fn) {
  let called = false;
  return function (...args) {
    if (!called) {
      called = true;
      setTimeout(() => {
        called = false;
        fn.apply(this, args);
      });
    }
  };
}
