FROM node
LABEL maintainer="Alexandre Lopes (morrungulo@gmail.com)"


# environment variables
ENV \
  SUMMARY="Web based financial analysis in node.js" \
  DESCRIPTION="A financial analysis program developed in node.js"


# install node.js modules
#RUN npm install -g \
#  express


# add own labels
LABEL name="home-projects/node" \
  version="1" \
  summary="${SUMMARY}" \
  description="${DESCRIPTION}" \
  build="docker build morrungulo/finance-analysis-dev" \
  usage="docker run -ti --rm -v path/to/your/dir:/repo morrungulo/finance-analysis-dev bash"


# setup workdir
ENV REPO=/repo
RUN mkdir -p ${REPO}
WORKDIR ${REPO}
ENV PATH=${REPO}${PATH:+:${PATH}}


# expose port
EXPOSE 3000
