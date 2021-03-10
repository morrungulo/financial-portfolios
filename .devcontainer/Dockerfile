FROM node
LABEL maintainer="Alexandre Lopes (morrungulo@gmail.com)"


# environment variables
ENV \
  SUMMARY="Web based financial portfolios in node.js" \
  DESCRIPTION="A financial portfolios program developed in node.js"


# install node.js modules
RUN npm install -g \
  nodemon


# add own labels
LABEL name="home-projects/node" \
  version="1" \
  summary="${SUMMARY}" \
  description="${DESCRIPTION}" \
  build="docker build morrungulo/financial-portfolios" \
  usage="docker run -ti --rm -v path/to/your/dir:/repo morrungulo/financial-portfolios bash"


# setup workdir
ENV REPO=/repo
RUN mkdir -p ${REPO}
WORKDIR ${REPO}
ENV PATH=${REPO}${PATH:+:${PATH}}


# expose port
EXPOSE 3000
